import { addDays, format } from 'date-fns';
import { getWeather, getWeatherGrid } from '$lib/api/weather';
import { locations } from '$lib/constants/locations';
import { getObservingCandidates } from '$lib/server/observingPlaces';
import { db } from '$lib/server/db';

const CACHE_TTL_MS = 2 * 60 * 60 * 1000;
const NIGHT_TIMES = ['1900', '2000', '2100', '2200', '2300'];
const EVENING_TIMES = ['1800', '1900', '2000'];
const DAWN_TIMES = ['0300', '0400', '0500'];
const MORNING_TIMES = ['0600', '0700', '0800', '0900', '1000', '1100'];
const AFTERNOON_TIMES = ['1200', '1300', '1400', '1500', '1600', '1700'];
const WEATHER_REQUEST_CONCURRENCY = 3;
const GRID_CACHE_MAX_ENTRIES = 128;
const weatherGridCache = new Map();
const weatherGridRequests = new Map();
const DEFAULT_LOCATION = {
	province: '서울특별시',
	city: '종로구',
	latitude: 37.5729503,
	longitude: 126.9793579
};
const PROVINCE_ALIASES = {
	서울: '서울특별시',
	부산: '부산광역시',
	대구: '대구광역시',
	인천: '인천광역시',
	광주: '광주광역시',
	대전: '대전광역시',
	울산: '울산광역시',
	세종: '세종특별자치시',
	경기: '경기도',
	강원: '강원도',
	충북: '충청북도',
	충남: '충청남도',
	전북: '전라북도',
	전남: '전라남도',
	경북: '경상북도',
	경남: '경상남도',
	제주: '제주특별자치도'
};

function skyText(value) {
	switch (String(value)) {
		case '1':
			return '맑음';
		case '2':
			return '구름적음';
		case '3':
			return '구름많음';
		case '4':
			return '흐림';
		default:
			return '-';
	}
}

function precipitationText(value) {
	switch (String(value)) {
		case '0':
			return '없음';
		case '1':
			return '비';
		case '2':
			return '비/눈';
		case '3':
			return '눈';
		case '4':
			return '소나기';
		default:
			return '-';
	}
}

function parseNumber(value) {
	if (value === undefined || value === null || value === '-') return null;
	const parsed = Number.parseFloat(String(value).replace(/[^\d.-]/g, ''));
	return Number.isNaN(parsed) ? null : parsed;
}

function hasFreshRows(rows) {
	if (!rows?.length) return false;
	const fetchedAt = new Date(rows[0].fetched_at).getTime();
	return Number.isFinite(fetchedAt) && Date.now() - fetchedAt < CACHE_TTL_MS;
}

function locationName(location) {
	return `${location.province} ${location.city}`;
}

function subjectParticle(text) {
	const lastChar = text.charCodeAt(text.length - 1);
	if (lastChar < 0xac00 || lastChar > 0xd7a3) return '이';
	return (lastChar - 0xac00) % 28 === 0 ? '가' : '이';
}

function normalizePlaceName(value) {
	return String(value || '')
		.replace(/\s/g, '')
		.replace(/특별자치시|특별자치도|특별시|광역시|자치시|자치도/g, '')
		.replace(/시|군|구|도/g, '');
}

function uniqueTimes(times) {
	return [...new Set(times)].sort();
}

function findLocation(message) {
	const compactMessage = message.replace(/\s/g, '');
	const normalizedMessage = normalizePlaceName(message);
	const provinceAlias = Object.entries(PROVINCE_ALIASES).find(([alias]) =>
		compactMessage.includes(alias)
	)?.[1];

	let bestMatch = null;
	let bestScore = 0;

	for (const location of locations) {
		if (!location.latitude || !location.longitude) continue;

		const province = location.province.replace(/\s/g, '');
		const city = location.city.replace(/\s/g, '');
		const normalizedProvince = normalizePlaceName(location.province);
		const normalizedCity = normalizePlaceName(location.city);
		let score = 0;

		if (compactMessage.includes(province + city)) score += 120;
		if (compactMessage.includes(city)) score += 80;
		if (normalizedCity.length >= 2 && normalizedMessage.includes(normalizedCity)) score += 60;
		if (compactMessage.includes(province)) score += 30;
		if (normalizedProvince.length >= 2 && normalizedMessage.includes(normalizedProvince)) score += 20;
		if (provinceAlias === location.province) score += 25;

		if (score > bestScore) {
			bestScore = score;
			bestMatch = location;
		}
	}

	if (bestMatch && bestScore >= 60) {
		return {
			...bestMatch,
			matched: true,
			matchScore: bestScore
		};
	}

	const provinceMatch = locations.find((location) =>
		compactMessage.includes(location.province.replace(/\s/g, '')) ||
		provinceAlias === location.province
	);
	if (provinceMatch?.latitude && provinceMatch?.longitude) {
		return {
			...provinceMatch,
			matched: true,
			matchScore: 30
		};
	}

	return {
		...DEFAULT_LOCATION,
		matched: false,
		matchScore: 0
	};
}

function normalizeUserCoordinates(value) {
	if (!value || typeof value !== 'object') return null;

	const latitude = Number(value.latitude);
	const longitude = Number(value.longitude);
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
	if (latitude < 33 || latitude > 39 || longitude < 124 || longitude > 132) return null;

	return { latitude, longitude };
}

function findLocationByCoordinates(coordinates) {
	let nearest = null;
	let nearestDistance = Infinity;

	for (const location of locations) {
		if (!location.latitude || !location.longitude) continue;
		const distance =
			(coordinates.latitude - location.latitude) ** 2 +
			(coordinates.longitude - location.longitude) ** 2;
		if (distance < nearestDistance) {
			nearest = location;
			nearestDistance = distance;
		}
	}

	return {
		...(nearest || DEFAULT_LOCATION),
		latitude: coordinates.latitude,
		longitude: coordinates.longitude,
		matched: true,
		matchScore: 100,
		locationSource: 'browser'
	};
}

function targetDateFromMessage(message) {
	const now = new Date();
	if (message.includes('글피')) return addDays(now, 3);
	if (message.includes('모레')) return addDays(now, 2);
	if (message.includes('내일')) return addDays(now, 1);
	return now;
}

function targetTimesFromMessage(message) {
	const explicitHours = [...message.matchAll(/(\d{1,2})\s*(시|:00)/g)]
		.map((match) => Number.parseInt(match[1], 10))
		.filter((hour) => hour >= 0 && hour <= 23)
		.map((hour) => `${String(hour).padStart(2, '0')}00`);

	if (explicitHours.length) {
		return uniqueTimes(explicitHours);
	}

	if (/(새벽|동틀|일출)/.test(message)) {
		return DAWN_TIMES;
	}

	if (/(저녁|퇴근)/.test(message)) {
		return EVENING_TIMES;
	}

	if (/(밤|야간|별|은하수|관측)/.test(message)) {
		return NIGHT_TIMES;
	}

	if (/(오전|아침)/.test(message)) {
		return MORNING_TIMES;
	}

	if (/(오후|낮|점심)/.test(message)) {
		return AFTERNOON_TIMES;
	}

	const hour = new Date().getHours();
	const roundedHour = String(Math.min(Math.max(hour, 0), 23)).padStart(2, '0');
	return [`${roundedHour}00`];
}

function summarizeWeatherItems(items, location) {
	const grouped = new Map();
	const fetchedAt = new Date().toISOString();

	for (const item of items) {
		const key = `${item.fcstDate}_${item.fcstTime}`;
		const existing = grouped.get(key) || {
			location_name: locationName(location),
			province: location.province,
			city: location.city,
			latitude: location.latitude,
			longitude: location.longitude,
			forecast_date: item.fcstDate,
			forecast_time: item.fcstTime,
			temperature: null,
			humidity: null,
			sky: null,
			sky_text: null,
			precipitation_type: null,
			precipitation_text: null,
			precipitation_probability: null,
			precipitation_amount: null,
			snowfall: null,
			is_observable: null,
			source: 'kma_vilage_fcst',
			fetched_at: fetchedAt
		};

		if (item.category === 'TMP') existing.temperature = parseNumber(item.fcstValue);
		if (item.category === 'REH') existing.humidity = parseNumber(item.fcstValue);
		if (item.category === 'SKY') {
			existing.sky = parseNumber(item.fcstValue);
			existing.sky_text = skyText(item.fcstValue);
		}
		if (item.category === 'PTY') {
			existing.precipitation_type = parseNumber(item.fcstValue);
			existing.precipitation_text = precipitationText(item.fcstValue);
		}
		if (item.category === 'POP') existing.precipitation_probability = parseNumber(item.fcstValue);
		if (item.category === 'PCP') existing.precipitation_amount = item.fcstValue;
		if (item.category === 'SNO') existing.snowfall = item.fcstValue;

		grouped.set(key, existing);
	}

	return [...grouped.values()].map((row) => ({
		...row,
		is_observable:
			row.sky !== null && row.sky <= 2 && (row.precipitation_type === null || row.precipitation_type === 0)
	}));
}

async function getCachedRows(location, targetDate, targetTimes) {
	try {
		const rows = await db.weatherCache.findMany({
			where: {
				locationName: locationName(location),
				forecastDate: format(targetDate, 'yyyyMMdd'),
				...(targetTimes?.length ? { forecastTime: { in: targetTimes } } : {})
			},
			orderBy: { forecastTime: 'asc' }
		});

		return rows.map((row) => ({
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
		}));
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
				const data = {
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

function formatRowsForPrompt(rows) {
	if (!rows.length) return '관련 예보 데이터가 없습니다.';

	return rows
		.map((row) => {
			const observable = row.is_observable ? '관측 유리' : '관측 불리';
			return [
				`- ${row.forecast_date} ${row.forecast_time}`,
				`지역: ${row.location_name}`,
				`기온: ${row.temperature ?? '-'}도`,
				`습도: ${row.humidity ?? '-'}%`,
				`하늘: ${row.sky_text ?? '-'}`,
				`강수형태: ${row.precipitation_text ?? '-'}`,
				`강수확률: ${row.precipitation_probability ?? '-'}%`,
				`강수량: ${row.precipitation_amount ?? '-'}`,
				`적설: ${row.snowfall ?? '-'}`,
				`판정: ${observable}`
			].join(', ');
		})
		.join('\n');
}

function summarizeObservation(rows) {
	if (!rows.length) {
		return '예보 데이터가 부족해서 관측 가능성을 판정할 수 없습니다.';
	}

	const observableCount = rows.filter((row) => row.is_observable).length;
	const bestRows = rows.filter((row) => row.is_observable).map((row) => row.forecast_time);
	const worstReasons = rows
		.filter((row) => !row.is_observable)
		.map((row) => {
			const reasons = [];
			if (row.sky !== null && row.sky > 2) reasons.push(row.sky_text || '구름 많음');
			if (row.precipitation_type !== null && row.precipitation_type > 0) {
				reasons.push(row.precipitation_text || '강수 있음');
			}
			if (row.precipitation_probability !== null && row.precipitation_probability >= 60) {
				reasons.push(`강수확률 ${row.precipitation_probability}%`);
			}
			return reasons.join('/');
		})
		.filter(Boolean);

	if (observableCount === rows.length) {
		return `조회한 시간대 전부 관측에 비교적 유리합니다. 추천 시간대: ${bestRows.join(', ')}`;
	}

	if (observableCount > 0) {
		return `일부 시간대만 관측에 유리합니다. 추천 시간대: ${bestRows.join(', ')}`;
	}

	return `조회한 시간대는 관측에 불리합니다. 주요 이유: ${[...new Set(worstReasons)].join(', ') || '하늘/강수 조건 불리'}`;
}

function findLocationByName(province, city) {
	return locations.find(
		(location) =>
			location.province === province &&
			location.city === city &&
			location.latitude &&
			location.longitude
	);
}

function distanceKm(first, second) {
	const latitudeDistance = (first.latitude - second.latitude) * 111;
	const longitudeDistance =
		(first.longitude - second.longitude) * 111 * Math.cos((first.latitude * Math.PI) / 180);
	return Math.sqrt(latitudeDistance ** 2 + longitudeDistance ** 2);
}

function scoreObservationRows(rows, siteScore = 0) {
	if (!rows.length) {
		return {
			score: -999 + siteScore,
			verdict: 'bad',
			recommendedTimes: [],
			observableCount: 0
		};
	}

	let score = siteScore;
	const recommendedTimes = [];

	for (const row of rows) {
		if (row.is_observable) {
			score += 34;
			recommendedTimes.push(row.forecast_time);
		}

		if (row.sky !== null && row.sky !== undefined) score += Math.max(0, 5 - row.sky) * 7;
		if (row.precipitation_type === 0 || row.precipitation_type === null) score += 8;
		if (row.precipitation_probability !== null && row.precipitation_probability !== undefined) {
			score += Math.max(0, 100 - row.precipitation_probability) / 8;
		}
		if (row.humidity !== null && row.humidity !== undefined) {
			score += Math.max(0, 90 - row.humidity) / 8;
		}
	}

	const observableCount = recommendedTimes.length;
	const verdict = observableCount === rows.length ? 'good' : observableCount > 0 ? 'mixed' : 'bad';

	return {
		score: Math.round(score),
		verdict,
		recommendedTimes,
		observableCount
	};
}

function recommendationTargetTimes(message) {
	const hasTimeHint = /(\d{1,2}\s*(시|:00)|새벽|동틀|일출|저녁|퇴근|밤|야간|별|은하수|관측|오전|아침|오후|낮|점심)/.test(
		message
	);
	return hasTimeHint ? targetTimesFromMessage(message) : NIGHT_TIMES;
}

function hasNearbyIntent(message) {
	return /(내\s*주변|주변|근처|가까운|인근)/.test(String(message || ''));
}

function filterRecommendationCandidates(message, candidates, userCoordinates) {
	const text = String(message || '');
	const compactMessage = text.replace(/\s/g, '');
	const normalizedMessage = normalizePlaceName(text);

	let scopedCandidates = candidates;
	if (/(전국|전체|모든지역|어디든|상관없)/.test(compactMessage)) return candidates;

	const cityMatches = candidates.filter((candidate) => {
		const normalizedCity = normalizePlaceName(candidate.city);
		return normalizedCity.length >= 2 && normalizedMessage.includes(normalizedCity);
	});
	if (cityMatches.length) scopedCandidates = cityMatches;

	if (!cityMatches.length) {
		const requestedProvince = Object.entries(PROVINCE_ALIASES).find(
			([alias, province]) =>
				compactMessage.includes(alias) ||
				compactMessage.includes(province.replace(/\s/g, '')) ||
				normalizedMessage.includes(normalizePlaceName(province))
		)?.[1];

		if (requestedProvince) {
			const provinceMatches = candidates.filter((candidate) => candidate.province === requestedProvince);
			if (provinceMatches.length) scopedCandidates = provinceMatches;
		}
	}

	if (userCoordinates && hasNearbyIntent(text)) {
		return [...scopedCandidates]
			.sort((first, second) => first.distanceKm - second.distanceKm)
			.slice(0, 5);
	}

	return scopedCandidates;
}

async function rowsForLocationDate(location, targetDate) {
	let rows = await getCachedRows(location, targetDate);

	if (!hasFreshRows(rows)) {
		try {
			const refreshedRows = await refreshWeatherCache(location);
			const targetDateValue = format(targetDate, 'yyyyMMdd');
			rows = refreshedRows.filter((row) => row.forecast_date === targetDateValue);
		} catch (error) {
			console.warn(`Weather refresh failed for ${locationName(location)}:`, error.message);
		}

		if (!rows.length) rows = await getCachedRows(location, targetDate);
	}

	return rows;
}

async function rowsForLocation(location, targetDate, targetTimes) {
	return selectWeatherRows(await rowsForLocationDate(location, targetDate), targetTimes);
}

function weatherGridKey(location) {
	const { nx, ny } = getWeatherGrid(location.latitude, location.longitude);
	return `${nx}:${ny}`;
}

function weatherRowsCacheKey(location, targetDate) {
	return `${weatherGridKey(location)}:${format(targetDate, 'yyyyMMdd')}`;
}

function rememberGridRows(cacheKey, rows) {
	if (!rows.length || !hasFreshRows(rows)) return;

	weatherGridCache.delete(cacheKey);
	weatherGridCache.set(cacheKey, rows);
	while (weatherGridCache.size > GRID_CACHE_MAX_ENTRIES) {
		weatherGridCache.delete(weatherGridCache.keys().next().value);
	}
}

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

	await Promise.all(
		Array.from({ length: Math.min(limit, items.length) }, () => consume())
	);

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

export async function buildBestObservationRecommendation(message, userLocation = null) {
	const targetDate = targetDateFromMessage(message);
	const targetTimes = recommendationTargetTimes(message);
	const userCoordinates = normalizeUserCoordinates(userLocation);
	const nearbyRequested = hasNearbyIntent(message);
	const observingPlaces = await getObservingCandidates();
	const candidates = filterRecommendationCandidates(message, observingPlaces.map((candidate) => ({
		...candidate,
		weatherLocation: findLocationByName(candidate.province, candidate.city),
		distanceKm: userCoordinates
			? Math.round(distanceKm(userCoordinates, candidate) * 10) / 10
			: null
	})).filter((candidate) => candidate.weatherLocation), userCoordinates);
	const gridGroups = new Map();
	for (const candidate of candidates) {
		const gridKey = weatherGridKey(candidate.weatherLocation);
		const group = gridGroups.get(gridKey) || {
			location: candidate.weatherLocation,
			candidates: []
		};
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
	const results = groupResults.flat().map(({ candidate, rows }) => {
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
	});

	const ranked = results.sort((a, b) => b.score - a.score).slice(0, 3);
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
