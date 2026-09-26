import { describe, expect, it } from 'vitest';
import {
	DAWN_TIMES,
	NIGHT_TIMES,
	filterRecommendationCandidates,
	findLocation,
	findLocationByCoordinates,
	normalizeUserCoordinates,
	recommendationTargetTimes,
	shouldUseRecommendation,
	shouldUseWeatherContext,
	targetDateFromMessage,
	targetTimesFromMessage
} from './questionIntent.js';

const dateKey = (date) => date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();

describe('findLocation', () => {
	it('시/군 이름으로 예보 지역을 찾는다', () => {
		expect(findLocation('내일 강릉에서 별 보기 괜찮아?')).toMatchObject({
			province: '강원도',
			city: '강릉시',
			matched: true
		});
	});

	it('"제주 서귀포"처럼 도 이름과 시 이름이 함께 있으면 더 구체적인 시를 고른다', () => {
		expect(findLocation('오늘 제주 서귀포에서 은하수 관측 가능해?')).toMatchObject({
			province: '제주특별자치도',
			city: '서귀포시'
		});
	});

	it('광역시/도 줄임말만 있으면 그 도의 지역을 고른다', () => {
		const location = findLocation('경북 날씨 어때?');
		expect(location.province).toBe('경상북도');
		expect(location.matched).toBe(true);
	});

	it('지역을 찾지 못하면 서울 종로구를 쓰고 matched: false로 알린다', () => {
		expect(findLocation('안드로메다 은하는 얼마나 멀어?')).toMatchObject({
			province: '서울특별시',
			city: '종로구',
			matched: false
		});
	});
});

describe('날짜·시간 해석', () => {
	const today = new Date(2026, 8, 27);

	it('내일·모레·글피를 한국 날짜 기준으로 더한다', () => {
		expect(dateKey(targetDateFromMessage('내일 별 보여?', today))).toBe(20260928);
		expect(dateKey(targetDateFromMessage('모레는?', today))).toBe(20260929);
		expect(dateKey(targetDateFromMessage('글피 관측', today))).toBe(20260930);
		expect(dateKey(targetDateFromMessage('지금 어때?', today))).toBe(20260927);
	});

	it('시각을 직접 말하면 그 시각을, 시간대 표현이 있으면 그 시간대를 고른다', () => {
		expect(targetTimesFromMessage('21시랑 9시에 어때')).toEqual(['0900', '2100']);
		expect(targetTimesFromMessage('새벽에 별 보여?')).toEqual(DAWN_TIMES);
		expect(targetTimesFromMessage('은하수 보일까')).toEqual(NIGHT_TIMES);
	});

	it('시간 단서가 없으면 한국 기준 현재 시각을 쓴다', () => {
		// 13:40 UTC = 22:40 KST
		expect(targetTimesFromMessage('날씨 어때', new Date('2026-09-27T13:40:00Z'))).toEqual(['2200']);
	});

	it('장소 추천은 시간 단서가 없으면 밤 시간대로 비교한다', () => {
		expect(recommendationTargetTimes('어디가 좋아?')).toEqual(NIGHT_TIMES);
	});
});

describe('좌표', () => {
	it('숫자가 아니거나 한반도 범위를 벗어난 좌표는 버린다', () => {
		expect(normalizeUserCoordinates({ latitude: '37.5', longitude: '127' })).toEqual({
			latitude: 37.5,
			longitude: 127
		});
		expect(normalizeUserCoordinates({ latitude: 35.68, longitude: 139.76 })).toBeNull();
		expect(normalizeUserCoordinates({ latitude: 'abc', longitude: 127 })).toBeNull();
		expect(normalizeUserCoordinates(null)).toBeNull();
	});

	it('브라우저 좌표는 가장 가까운 예보 지역 이름을 쓰되 좌표는 그대로 둔다', () => {
		expect(findLocationByCoordinates({ latitude: 37.573, longitude: 126.9794 })).toMatchObject({
			province: '서울특별시',
			city: '종로구',
			latitude: 37.573,
			longitude: 126.9794,
			locationSource: 'browser'
		});
	});
});

describe('filterRecommendationCandidates', () => {
	const candidates = [
		{ name: '안반데기', province: '강원도', city: '강릉시', distanceKm: 150 },
		{ name: '육백마지기', province: '강원도', city: '평창군', distanceKm: 120 },
		{ name: '제주 1100고지', province: '제주특별자치도', city: '서귀포시', distanceKm: 480 },
		{ name: '새별오름', province: '제주특별자치도', city: '제주시', distanceKm: 470 }
	];
	const names = (list) => list.map((candidate) => candidate.name);

	it('질문에 시/군 이름이 있으면 그 지역 후보만 남긴다', () => {
		expect(names(filterRecommendationCandidates('강릉 별 명소 추천', candidates, null))).toEqual(['안반데기']);
	});

	it('"제주"는 제주시 하나가 아니라 제주도 전체로 본다', () => {
		expect(names(filterRecommendationCandidates('제주 관측지 추천', candidates, null))).toEqual([
			'제주 1100고지',
			'새별오름'
		]);
		expect(names(filterRecommendationCandidates('제주시 관측지 추천', candidates, null))).toEqual(['새별오름']);
	});

	it('"근처"를 묻고 위치를 알면 가까운 순으로 좁힌다', () => {
		const nearby = filterRecommendationCandidates('근처 별 보기 좋은 곳', candidates, {
			latitude: 37.5,
			longitude: 127
		});
		expect(names(nearby).slice(0, 2)).toEqual(['육백마지기', '안반데기']);
	});

	it('"전국"이면 모든 후보를 비교한다', () => {
		expect(filterRecommendationCandidates('전국 관측지 추천', candidates, null)).toHaveLength(4);
	});
});

describe('질문 의도', () => {
	it('장소를 묻는 관측 질문만 장소 추천으로 보낸다', () => {
		expect(shouldUseRecommendation('오늘 별 관측 장소 추천해줘')).toBe(true);
		expect(shouldUseRecommendation('오늘 어둡고 탁 트인 곳 어디야?')).toBe(true);
		expect(shouldUseRecommendation('모레 강릉에서 별 관측 가능해?')).toBe(false);
		expect(shouldUseRecommendation('근처 기온 알려줘')).toBe(false);
	});

	it('날씨·관측과 관련된 질문에만 예보 근거를 붙인다', () => {
		expect(shouldUseWeatherContext('모레 강릉에서 별 관측 가능해?')).toBe(true);
		expect(shouldUseWeatherContext('안드로메다 은하는 얼마나 멀어?')).toBe(false);
	});
});
