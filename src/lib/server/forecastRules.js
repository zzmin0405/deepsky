// 기상청 단기예보 값을 해석하고 관측 가능성을 판정·점수화하는 순수 함수 모음입니다.
// 네트워크나 DB에 의존하지 않으므로 규칙을 단위 테스트로 고정할 수 있습니다.

export const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

const SKY_TEXT = { 1: '맑음', 2: '구름적음', 3: '구름많음', 4: '흐림' };
const PRECIPITATION_TEXT = { 0: '없음', 1: '비', 2: '비/눈', 3: '눈', 4: '소나기' };

export function skyText(value) {
	return SKY_TEXT[String(value)] ?? '-';
}

export function precipitationText(value) {
	return PRECIPITATION_TEXT[String(value)] ?? '-';
}

export function parseNumber(value) {
	if (value === undefined || value === null || value === '-') return null;
	const parsed = Number.parseFloat(String(value).replace(/[^\d.-]/g, ''));
	return Number.isNaN(parsed) ? null : parsed;
}

export function locationName(location) {
	return `${location.province} ${location.city}`;
}

// 하늘이 맑거나 구름이 적고(SKY 1~2) 비·눈이 없을 때 관측에 유리한 시간으로 봅니다.
export function isObservable(row) {
	return (
		row.sky !== null &&
		row.sky <= 2 &&
		(row.precipitation_type === null || row.precipitation_type === 0)
	);
}

// 기상청 응답은 시간마다 항목(TMP, SKY, PTY...)이 한 줄씩 오므로 시간 단위 한 행으로 묶습니다.
export function summarizeWeatherItems(items, location, fetchedAt = new Date().toISOString()) {
	const grouped = new Map();

	for (const item of items) {
		const key = `${item.fcstDate}_${item.fcstTime}`;
		const row = grouped.get(key) || {
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

		if (item.category === 'TMP') row.temperature = parseNumber(item.fcstValue);
		if (item.category === 'REH') row.humidity = parseNumber(item.fcstValue);
		if (item.category === 'SKY') {
			row.sky = parseNumber(item.fcstValue);
			row.sky_text = skyText(item.fcstValue);
		}
		if (item.category === 'PTY') {
			row.precipitation_type = parseNumber(item.fcstValue);
			row.precipitation_text = precipitationText(item.fcstValue);
		}
		if (item.category === 'POP') row.precipitation_probability = parseNumber(item.fcstValue);
		if (item.category === 'PCP') row.precipitation_amount = item.fcstValue;
		if (item.category === 'SNO') row.snowfall = item.fcstValue;

		grouped.set(key, row);
	}

	return [...grouped.values()].map((row) => ({ ...row, is_observable: isObservable(row) }));
}

// 같은 날짜라도 이른 시간대는 이전 발표분에서만 채워집니다.
// 첫 행만 보면 캐시가 늘 오래된 것으로 판정되므로, 가장 최근에 받아온 시각으로 판단합니다.
export function hasFreshRows(rows, now = Date.now()) {
	if (!rows?.length) return false;
	const latestFetchedAt = Math.max(
		...rows.map((row) => new Date(row.fetched_at).getTime()).filter(Number.isFinite)
	);
	return Number.isFinite(latestFetchedAt) && now - latestFetchedAt < CACHE_TTL_MS;
}

export function formatRowsForPrompt(rows) {
	if (!rows.length) return '관련 예보 데이터가 없습니다.';

	return rows
		.map((row) =>
			[
				`- ${row.forecast_date} ${row.forecast_time}`,
				`지역: ${row.location_name}`,
				`기온: ${row.temperature ?? '-'}도`,
				`습도: ${row.humidity ?? '-'}%`,
				`하늘: ${row.sky_text ?? '-'}`,
				`강수형태: ${row.precipitation_text ?? '-'}`,
				`강수확률: ${row.precipitation_probability ?? '-'}%`,
				`강수량: ${row.precipitation_amount ?? '-'}`,
				`적설: ${row.snowfall ?? '-'}`,
				`판정: ${row.is_observable ? '관측 유리' : '관측 불리'}`
			].join(', ')
		)
		.join('\n');
}

export function summarizeObservation(rows) {
	if (!rows.length) {
		return '예보 데이터가 부족해서 관측 가능성을 판정할 수 없습니다.';
	}

	const bestTimes = rows.filter((row) => row.is_observable).map((row) => row.forecast_time);
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

	if (bestTimes.length === rows.length) {
		return `조회한 시간대 전부 관측에 비교적 유리합니다. 추천 시간대: ${bestTimes.join(', ')}`;
	}

	if (bestTimes.length > 0) {
		return `일부 시간대만 관측에 유리합니다. 추천 시간대: ${bestTimes.join(', ')}`;
	}

	return `조회한 시간대는 관측에 불리합니다. 주요 이유: ${[...new Set(worstReasons)].join(', ') || '하늘/강수 조건 불리'}`;
}

// 장소 점수(광해·고도·개방감)에 시간대별 예보 점수를 더합니다.
// 관측 유리 시간이 가장 크게 반영되고, 구름·강수확률·습도는 보조 점수입니다.
export function scoreObservationRows(rows, siteScore = 0) {
	if (!rows.length) {
		return { score: -999 + siteScore, verdict: 'bad', recommendedTimes: [], observableCount: 0 };
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

	return { score: Math.round(score), verdict, recommendedTimes, observableCount };
}

// 위도 1도를 약 111km로 보는 근사식입니다. 한반도 규모의 거리 비교에는 충분합니다.
export function distanceKm(first, second) {
	const latitudeDistance = (first.latitude - second.latitude) * 111;
	const longitudeDistance =
		(first.longitude - second.longitude) * 111 * Math.cos((first.latitude * Math.PI) / 180);
	return Math.sqrt(latitudeDistance ** 2 + longitudeDistance ** 2);
}

// 기상청 단기예보 활용가이드 기준으로 강수량·적설량의 '-', null, 0 값은 각각 "강수없음", "적설없음"입니다.
export function normalizeAmount(value, emptyText) {
	const text = value === null || value === undefined ? '' : String(value).trim();
	return ['', '-', '0', '0.0'].includes(text) ? emptyText : text;
}

// 홈 화면 API가 내려주는 시간대별 예보 한 행입니다.
export function toForecastRow(row) {
	return {
		time: row.forecast_time,
		temperature: row.temperature,
		humidity: row.humidity,
		sky: row.sky,
		skyText: row.sky_text,
		precipitationType: row.precipitation_type,
		precipitationText: row.precipitation_text,
		precipitationProbability: row.precipitation_probability,
		precipitationAmount: normalizeAmount(row.precipitation_amount, '강수없음'),
		snowfall: normalizeAmount(row.snowfall, '적설없음'),
		observable: row.is_observable
	};
}
