// 사용자 질문에서 지역·날짜·시간대·의도를 읽어내는 순수 함수 모음입니다.
// "현재 시각"과 지역 목록은 인자로 바꿔 넣을 수 있어 테스트에서 고정할 수 있습니다.
import { addDays } from 'date-fns';
import { locations } from '$lib/constants/locations';
import { kstParts, kstToday } from '$lib/kst';

export const NIGHT_TIMES = ['1900', '2000', '2100', '2200', '2300'];
export const EVENING_TIMES = ['1800', '1900', '2000'];
export const DAWN_TIMES = ['0300', '0400', '0500'];
export const MORNING_TIMES = ['0600', '0700', '0800', '0900', '1000', '1100'];
export const AFTERNOON_TIMES = ['1200', '1300', '1400', '1500', '1600', '1700'];

export const DEFAULT_LOCATION = {
	province: '서울특별시',
	city: '종로구',
	latitude: 37.5729503,
	longitude: 126.9793579
};

export const PROVINCE_ALIASES = {
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

const PROVINCE_ALIAS_NAMES = new Set(Object.keys(PROVINCE_ALIASES));

// "강릉시", "강릉" 처럼 행정구역 접미사가 붙거나 빠진 표현을 같은 이름으로 비교합니다.
export function normalizePlaceName(value) {
	return String(value || '')
		.replace(/\s/g, '')
		.replace(/특별자치시|특별자치도|특별시|광역시|자치시|자치도/g, '')
		.replace(/시|군|구|도/g, '');
}

// 접미사를 뗀 시/군 이름이 질문에 들어 있는지 봅니다.
// "제주", "광주"처럼 광역시/도 줄임말과 같은 이름은 도 전체를 뜻하는 경우가 많으므로
// "제주시"처럼 시 이름을 그대로 쓴 경우에만 그 시로 봅니다.
function mentionsCity(city, compactMessage, normalizedMessage) {
	const normalizedCity = normalizePlaceName(city);
	if (normalizedCity.length < 2 || !normalizedMessage.includes(normalizedCity)) return false;
	return compactMessage.includes(city.replace(/\s/g, '')) || !PROVINCE_ALIAS_NAMES.has(normalizedCity);
}

function uniqueTimes(times) {
	return [...new Set(times)].sort();
}

// 질문에 들어 있는 시/군/구와 광역시/도 이름에 점수를 매겨 가장 그럴듯한 예보 지역을 고릅니다.
// 찾지 못하면 기본 지역(서울 종로구)을 matched: false로 돌려줍니다.
export function findLocation(message, candidates = locations) {
	const compactMessage = message.replace(/\s/g, '');
	const normalizedMessage = normalizePlaceName(message);
	const provinceAlias = Object.entries(PROVINCE_ALIASES).find(([alias]) =>
		compactMessage.includes(alias)
	)?.[1];

	let bestMatch = null;
	let bestScore = 0;

	for (const location of candidates) {
		if (!location.latitude || !location.longitude) continue;

		const province = location.province.replace(/\s/g, '');
		const city = location.city.replace(/\s/g, '');
		const normalizedProvince = normalizePlaceName(location.province);
		let score = 0;

		if (compactMessage.includes(province + city)) score += 120;
		if (compactMessage.includes(city)) score += 80;
		if (mentionsCity(location.city, compactMessage, normalizedMessage)) score += 60;
		if (compactMessage.includes(province)) score += 30;
		if (normalizedProvince.length >= 2 && normalizedMessage.includes(normalizedProvince)) score += 20;
		if (provinceAlias === location.province) score += 25;

		if (score > bestScore) {
			bestScore = score;
			bestMatch = location;
		}
	}

	if (bestMatch && bestScore >= 60) {
		return { ...bestMatch, matched: true, matchScore: bestScore };
	}

	const provinceMatch = candidates.find(
		(location) =>
			compactMessage.includes(location.province.replace(/\s/g, '')) ||
			provinceAlias === location.province
	);
	if (provinceMatch?.latitude && provinceMatch?.longitude) {
		return { ...provinceMatch, matched: true, matchScore: 30 };
	}

	return { ...DEFAULT_LOCATION, matched: false, matchScore: 0 };
}

// 브라우저가 보낸 좌표는 숫자이고 한반도 범위 안일 때만 씁니다.
export function normalizeUserCoordinates(value) {
	if (!value || typeof value !== 'object') return null;

	const latitude = Number(value.latitude);
	const longitude = Number(value.longitude);
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
	if (latitude < 33 || latitude > 39 || longitude < 124 || longitude > 132) return null;

	return { latitude, longitude };
}

export function findLocationByCoordinates(coordinates, candidates = locations) {
	let nearest = null;
	let nearestDistance = Infinity;

	for (const location of candidates) {
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

export function findLocationByName(province, city, candidates = locations) {
	return candidates.find(
		(location) =>
			location.province === province &&
			location.city === city &&
			location.latitude &&
			location.longitude
	);
}

export function targetDateFromMessage(message, today = kstToday()) {
	if (message.includes('글피')) return addDays(today, 3);
	if (message.includes('모레')) return addDays(today, 2);
	if (message.includes('내일')) return addDays(today, 1);
	return today;
}

// "21시"처럼 시각을 직접 말하면 그 시각을, 아니면 "새벽", "밤" 같은 표현으로 시간대를 고릅니다.
// 아무 단서가 없으면 한국 기준 현재 시각 한 시간만 봅니다.
export function targetTimesFromMessage(message, now = new Date()) {
	const explicitHours = [...message.matchAll(/(\d{1,2})\s*(시|:00)/g)]
		.map((match) => Number.parseInt(match[1], 10))
		.filter((hour) => hour >= 0 && hour <= 23)
		.map((hour) => `${String(hour).padStart(2, '0')}00`);

	if (explicitHours.length) return uniqueTimes(explicitHours);
	if (/(새벽|동틀|일출)/.test(message)) return DAWN_TIMES;
	if (/(저녁|퇴근)/.test(message)) return EVENING_TIMES;
	if (/(밤|야간|별|은하수|관측)/.test(message)) return NIGHT_TIMES;
	if (/(오전|아침)/.test(message)) return MORNING_TIMES;
	if (/(오후|낮|점심)/.test(message)) return AFTERNOON_TIMES;

	const { hour } = kstParts(now);
	return [`${String(hour).padStart(2, '0')}00`];
}

// 장소 추천은 시간 단서가 없으면 밤 시간대(19~23시)를 기준으로 비교합니다.
export function recommendationTargetTimes(message, now = new Date()) {
	const hasTimeHint =
		/(\d{1,2}\s*(시|:00)|새벽|동틀|일출|저녁|퇴근|밤|야간|별|은하수|관측|오전|아침|오후|낮|점심)/.test(
			message
		);
	return hasTimeHint ? targetTimesFromMessage(message, now) : NIGHT_TIMES;
}

export function hasNearbyIntent(message) {
	return /(내\s*주변|주변|근처|가까운|인근)/.test(String(message || ''));
}

// 질문에 시/군이나 광역시/도가 있으면 후보를 그 지역으로 좁히고,
// "근처"를 묻고 위치를 알면 가까운 5곳만 남깁니다.
export function filterRecommendationCandidates(message, candidates, userCoordinates) {
	const text = String(message || '');
	const compactMessage = text.replace(/\s/g, '');
	const normalizedMessage = normalizePlaceName(text);

	if (/(전국|전체|모든지역|어디든|상관없)/.test(compactMessage)) return candidates;

	let scopedCandidates = candidates;
	const cityMatches = candidates.filter((candidate) =>
		mentionsCity(candidate.city, compactMessage, normalizedMessage)
	);
	if (cityMatches.length) scopedCandidates = cityMatches;

	if (!cityMatches.length) {
		const requestedProvince = Object.entries(PROVINCE_ALIASES).find(
			([alias, province]) =>
				compactMessage.includes(alias) ||
				compactMessage.includes(province.replace(/\s/g, '')) ||
				normalizedMessage.includes(normalizePlaceName(province))
		)?.[1];

		if (requestedProvince) {
			const provinceMatches = candidates.filter(
				(candidate) => candidate.province === requestedProvince
			);
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

// 날씨·관측과 관련된 단어가 있으면 예보를 찾아 LLM 답변의 근거로 붙입니다.
export function shouldUseWeatherContext(message) {
	return /(날씨|기온|온도|습도|하늘|구름|비|눈|별|은하수|관측|오늘|내일|모레|글피|밤|저녁|새벽|어때|괜찮|가능|추천)/.test(
		message
	);
}

// "어디", "추천", "근처" 같은 장소 의도와 관측 의도가 함께 있고 날씨만 묻는 질문이 아니면 장소 추천으로 답합니다.
export function shouldUseRecommendation(message) {
	const text = String(message || '');
	const hasPlaceIntent =
		/(추천|어디|좋은\s*곳|명소|전체|전국|장소|관측지|주변|근처|베스트|TOP|탑|어둡|탁\s*트)/i.test(text);
	const hasObservingIntent = /(별|은하수|관측|장소|곳|오늘|내일|모레|글피)/.test(text);
	const weatherOnlyIntent = /(기온|온도|습도|비|눈|강수확률만|날씨만)/.test(text);

	return hasPlaceIntent && hasObservingIntent && !weatherOnlyIntent;
}
