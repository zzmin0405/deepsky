// 예보 조회 경로를 조립합니다: 격자 메모리 캐시 → MySQL 캐시 → 기상청 API 순으로 확인합니다.
// 판정·점수 규칙은 forecastRules, 질문 해석은 questionIntent에 두고 여기서는 조회와 캐시만 다룹니다.
import { addDays, format } from 'date-fns';
import { kstToday } from '$lib/kst';
import { subjectParticle } from '$lib/korean';
import { db } from '$lib/server/db';
import {
	CACHE_TTL_MS,
	distanceKm,
	formatRowsForPrompt,
	hasFreshRows,
	locationName,
	scoreObservationRows,
	summarizeObservation,
	summarizeWeatherItems
} from '$lib/server/forecastRules';
import { getObservingCandidates } from '$lib/server/observingPlaces';
import {
	filterRecommendationCandidates,
	findLocation,
	findLocationByCoordinates,
	findLocationByName,
	hasNearbyIntent,
	normalizeUserCoordinates,
	recommendationTargetTimes,
	targetDateFromMessage,
	targetTimesFromMessage
} from '$lib/server/questionIntent';
import { getWeather, getWeatherGrid } from '$lib/server/weather';

const WEATHER_REQUEST_CONCURRENCY = 3;
const GRID_CACHE_MAX_ENTRIES = 128;
const GRID_REFRESH_MAX_ENTRIES = 512;
const FORECAST_DAY_LABELS = ['오늘', '내일', '모레'];

// 격자·날짜별 예보 행, 진행 중인 조회(중복 요청 합치기), 격자별 마지막 기상청 조회 시각입니다.
const weatherGridCache = new Map();
const weatherGridRequests = new Map();
const gridRefreshedAt = new Map();

function toRowFromCache(row) {
	return {
		location_name: row.locationName,
		province: row.province,
		city: row.city,
		latitude: row.latitude,
		longitude: row.longitude,
		forecast_date: row.forecastDate,
		forecast_time: row.forecastTime,
		temperature: row.temperature,
		humidity: row.humidity,
		sky: row.sky,
		sky_text: row.skyText,
		precipitation_type: row.precipitationType,
		precipitation_text: row.precipitationText,
		precipitation_probability: row.precipitationProbability,
		precipitation_amount: row.precipitationAmount,
		snowfall: row.snowfall,
		is_observable: row.isObservable,
		source: row.source,
		fetched_at: row.fetchedAt
	};
}

function toCacheRecord(row) {
	return {
		locationName: row.location_name,
		province: row.province,
		city: row.city,
		latitude: row.latitude,
		longitude: row.longitude,
		forecastDate: row.forecast_date,
		forecastTime: row.forecast_time,
		temperature: row.temperature,
		humidity: row.humidity,
		sky: row.sky,
		skyText: row.sky_text,
		precipitationType: row.precipitation_type,
		precipitationText: row.precipitation_text,
		precipitationProbability: row.precipitation_probability,
		precipitationAmount: row.precipitation_amount,
		snowfall: row.snowfall,
		isObservable: row.is_observable,
		source: row.source,
		fetchedAt: new Date(row.fetched_at)
	};
}

// MySQL을 쓸 수 없으면 빈 배열을 돌려 기상청 조회로 넘어갑니다.
async function getCachedRows(location, targetDate) {
	try {
		const rows = await db.weatherCache.findMany({
			where: {
				locationName: locationName(location),
				forecastDate: format(targetDate, 'yyyyMMdd')
			},
			orderBy: { forecastTime: 'asc' }
		});
		return rows.map(toRowFromCache);
	} catch (error) {
		console.error('MySQL weather cache read error:', error.message);
		return [];
	}
}

function selectWeatherRows(rows, targetTimes) {
	if (!targetTimes?.length) return rows;
	return rows.filter((row) => targetTimes.includes(row.forecast_time));
}

async function refreshWeatherCache(location) {
	const rawItems = await getWeather(location.latitude, location.longitude);
	const rows = summarizeWeatherItems(Array.isArray(rawItems) ? rawItems : [], location);
	if (!rows.length) return [];

	try {
		await db.$transaction(
			rows.map((row) => {
				const data = toCacheRecord(row);
				return db.weatherCache.upsert({
					where: {
						locationName_forecastDate_forecastTime: {
							locationName: row.location_name,
							forecastDate: row.forecast_date,
							forecastTime: row.forecast_time
						}
					},
					create: data,
					update: data
				});
			})
		);
	} catch (error) {
		console.error('MySQL weather cache upsert error:', error.message);
	}

	return rows;
}

function weatherGridKey(location) {
	const { nx, ny } = getWeatherGrid(location.latitude, location.longitude);
	return `${nx}:${ny}`;
}

function weatherRowsCacheKey(location, targetDate) {
	return `${weatherGridKey(location)}:${format(targetDate, 'yyyyMMdd')}`;
}

function refreshedRecently(location) {
	const refreshedAt = gridRefreshedAt.get(weatherGridKey(location));
	return refreshedAt !== undefined && Date.now() - refreshedAt < CACHE_TTL_MS;
}

function markGridRefreshed(location) {
	const gridKey = weatherGridKey(location);
	gridRefreshedAt.delete(gridKey);
	gridRefreshedAt.set(gridKey, Date.now());
	while (gridRefreshedAt.size > GRID_REFRESH_MAX_ENTRIES) {
		gridRefreshedAt.delete(gridRefreshedAt.keys().next().value);
	}
}

function rememberGridRows(cacheKey, rows) {
	if (!rows.length || !hasFreshRows(rows)) return;

	weatherGridCache.delete(cacheKey);
	weatherGridCache.set(cacheKey, rows);
	while (weatherGridCache.size > GRID_CACHE_MAX_ENTRIES) {
		weatherGridCache.delete(weatherGridCache.keys().next().value);
	}
}

// 기상청 응답에는 여러 날짜가 한 번에 들어 있으므로 날짜별로 격자 캐시에 넣어 두고 재사용합니다.
function rememberRefreshedRows(location, rows) {
	const rowsByDate = new Map();
	for (const row of rows) {
		const dateRows = rowsByDate.get(row.forecast_date) || [];
		dateRows.push(row);
		rowsByDate.set(row.forecast_date, dateRows);
	}

	const gridKey = weatherGridKey(location);
	for (const [forecastDate, dateRows] of rowsByDate) {
		rememberGridRows(`${gridKey}:${forecastDate}`, dateRows);
	}
}

async function rowsForLocationDate(location, targetDate) {
	let rows = await getCachedRows(location, targetDate);

	// 방금 새로 받았는데도 해당 날짜의 새 행이 없으면(예: 23시 발표분에는 오늘 데이터가 없음)
	// 요청마다 기상청을 다시 부르지 않고 캐시에 남은 이전 발표분을 씁니다.
	const canReuseStaleRows = rows.length > 0 && refreshedRecently(location);
	if (!hasFreshRows(rows) && !canReuseStaleRows) {
		try {
			const refreshedRows = await refreshWeatherCache(location);
			if (refreshedRows.length) {
				markGridRefreshed(location);
				rememberRefreshedRows(location, refreshedRows);
			}
			const targetDateValue = format(targetDate, 'yyyyMMdd');
			rows = refreshedRows.filter((row) => row.forecast_date === targetDateValue);
		} catch (error) {
			console.warn(`Weather refresh failed for ${locationName(location)}:`, error.message);
		}

		if (!rows.length) rows = await getCachedRows(location, targetDate);
	}

	return rows;
}

// 같은 격자·날짜를 동시에 여러 번 요청해도 기상청 호출은 한 번만 나가도록 진행 중인 요청을 공유합니다.
async function rowsForGrid(location, targetDate, targetTimes) {
	const cacheKey = weatherRowsCacheKey(location, targetDate);
	const cachedRows = weatherGridCache.get(cacheKey);
	if (cachedRows && hasFreshRows(cachedRows)) {
		return selectWeatherRows(cachedRows, targetTimes);
	}

	const pendingRequest = weatherGridRequests.get(cacheKey);
	if (pendingRequest) return selectWeatherRows(await pendingRequest, targetTimes);

	const request = rowsForLocationDate(location, targetDate)
		.then((rows) => {
			rememberGridRows(cacheKey, rows);
			return rows;
		})
		.finally(() => weatherGridRequests.delete(cacheKey));

	weatherGridRequests.set(cacheKey, request);
	return selectWeatherRows(await request, targetTimes);
}

async function mapWithConcurrency(items, limit, worker) {
	const results = new Array(items.length);
	let nextIndex = 0;

	async function consume() {
		while (nextIndex < items.length) {
			const index = nextIndex++;
			results[index] = await worker(items[index], index);
		}
	}

	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => consume()));
	return results;
}

function relabelWeatherRows(rows, location) {
	return rows.map((row) => ({
		...row,
		location_name: locationName(location),
		province: location.province,
		city: location.city,
		latitude: location.latitude,
		longitude: location.longitude
	}));
}

function toRecommendation(candidate, rows) {
	const location = candidate.weatherLocation;
	const score = scoreObservationRows(rows, candidate.siteScore);

	return {
		location,
		placeName: candidate.name,
		locationName: candidate.name,
		weatherRegion: locationName(location),
		description: candidate.description,
		document: candidate.document,
		tags: candidate.tags,
		elevationM: candidate.elevationM,
		lightPollutionScore: candidate.lightPollutionScore,
		bortleClass: candidate.bortleClass,
		sqmMagArcsec2: candidate.sqmMagArcsec2,
		lightPollutionYear: candidate.lightPollutionYear,
		opennessScore: candidate.opennessScore,
		accessScore: candidate.accessScore,
		distanceKm: candidate.distanceKm,
		rows,
		score: score.score,
		verdict: score.verdict,
		observableCount: score.observableCount,
		recommendedTimes: score.recommendedTimes,
		summary: summarizeObservation(rows)
	};
}

// 관측지 후보마다 예보를 붙여 점수를 매기고 상위 3곳을 고릅니다.
// 같은 예보 격자에 있는 후보는 한 번만 조회합니다.
export async function buildBestObservationRecommendation(message, userLocation = null) {
	const targetDate = targetDateFromMessage(message);
	const targetTimes = recommendationTargetTimes(message);
	const userCoordinates = normalizeUserCoordinates(userLocation);
	const nearbyRequested = hasNearbyIntent(message);
	const observingPlaces = await getObservingCandidates();
	const withWeatherLocation = observingPlaces
		.map((candidate) => ({
			...candidate,
			weatherLocation: findLocationByName(candidate.province, candidate.city),
			distanceKm: userCoordinates
				? Math.round(distanceKm(userCoordinates, candidate) * 10) / 10
				: null
		}))
		.filter((candidate) => candidate.weatherLocation);
	const candidates = filterRecommendationCandidates(message, withWeatherLocation, userCoordinates);

	const gridGroups = new Map();
	for (const candidate of candidates) {
		const gridKey = weatherGridKey(candidate.weatherLocation);
		const group = gridGroups.get(gridKey) || { location: candidate.weatherLocation, candidates: [] };
		group.candidates.push(candidate);
		gridGroups.set(gridKey, group);
	}

	const groupResults = await mapWithConcurrency(
		[...gridGroups.values()],
		WEATHER_REQUEST_CONCURRENCY,
		async (group) => {
			try {
				const rows = await rowsForGrid(group.location, targetDate, targetTimes);
				return group.candidates.map((candidate) => ({
					candidate,
					rows: relabelWeatherRows(rows, candidate.weatherLocation)
				}));
			} catch (error) {
				console.error(`Weather recommendation failed for ${locationName(group.location)}:`, error);
				return [];
			}
		}
	);

	const ranked = groupResults
		.flat()
		.map(({ candidate, rows }) => toRecommendation(candidate, rows))
		.sort((a, b) => b.score - a.score)
		.slice(0, 3);
	const best = ranked[0];

	return {
		targetDate: format(targetDate, 'yyyy-MM-dd'),
		targetTimes,
		candidateCount: candidates.length,
		locationSource: userCoordinates ? 'browser' : nearbyRequested ? 'unavailable' : 'message',
		nearby: Boolean(userCoordinates && nearbyRequested),
		locationUnavailable: Boolean(nearbyRequested && !userCoordinates),
		summary: best
			? `${best.placeName}${subjectParticle(best.placeName)} 가장 좋아 보여요. ${best.description} ${best.summary}`
			: '추천 후보 지역의 예보 데이터를 불러오지 못했어요.',
		recommendations: ranked,
		context: ranked
			.map(
				(item, index) =>
					`${index + 1}. ${item.placeName} / 예보 기준 ${item.weatherRegion} / 점수 ${item.score} / 장소 특성: ${item.description} / 상세 문서: ${item.document || '-'} / ${item.summary}\n${formatRowsForPrompt(item.rows)}`
			)
			.join('\n\n')
	};
}

// 질문의 지역(없으면 브라우저 위치, 그것도 없으면 서울)·날짜·시간대의 예보를 LLM 근거로 모읍니다.
export async function buildWeatherRagContext(message, userLocation = null) {
	const messageLocation = findLocation(message);
	const userCoordinates = normalizeUserCoordinates(userLocation);
	const location = messageLocation.matched
		? messageLocation
		: userCoordinates
			? findLocationByCoordinates(userCoordinates)
			: messageLocation;
	const targetDate = targetDateFromMessage(message);
	const targetTimes = targetTimesFromMessage(message);
	const rows = await rowsForGrid(location, targetDate, targetTimes);

	return {
		location,
		locationMatched: location.matched,
		locationSource: location.locationSource || 'message',
		targetDate: format(targetDate, 'yyyy-MM-dd'),
		targetTimes,
		rows,
		summary: summarizeObservation(rows),
		context: formatRowsForPrompt(rows)
	};
}

// 홈 화면 시간대별 표에 쓰는 오늘·내일·모레 예보입니다.
// 첫 날짜를 조회할 때 받은 기상청 응답이 날짜별 격자 캐시에 들어가므로 나머지 날짜는 순서대로 캐시에서 읽습니다.
export async function buildForecastTimeline(location) {
	const today = kstToday();
	const days = [];

	for (const [offset, label] of FORECAST_DAY_LABELS.entries()) {
		const date = addDays(today, offset);
		const rows = await rowsForGrid(location, date);
		days.push({ date: format(date, 'yyyyMMdd'), label, rows });
	}

	return { location, days };
}
