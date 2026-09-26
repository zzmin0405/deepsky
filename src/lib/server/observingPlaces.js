import { db } from './db.js';

export const FALLBACK_OBSERVING_PLACES = [
	{
		name: '안반데기',
		province: '강원도',
		city: '강릉시',
		latitude: 37.6228243,
		longitude: 128.7504048,
		siteScore: 31,
		elevationM: 1100,
		lightPollutionScore: 7.1,
		bortleClass: 4.8,
		sqmMagArcsec2: 20.84,
		lightPollutionYear: 2024,
		opennessScore: 9.2,
		accessScore: 6.5,
		description: '고도가 높고 시야가 넓은 고랭지 지형이라 밤하늘이 트여 보입니다.',
		document:
			'안반데기는 강릉 왕산면의 고랭지 배추밭 일대로, 고도가 높고 주변 시야가 넓어 은하수 촬영 후보지로 자주 언급된다. 겨울철에는 강풍과 도로 결빙에 주의해야 한다.',
		tags: ['고지대', '탁 트임', '은하수']
	},
	{
		name: '육백마지기',
		province: '강원도',
		city: '평창군',
		latitude: 37.4706,
		longitude: 128.5536,
		siteScore: 30,
		elevationM: 1200,
		lightPollutionScore: 8.2,
		bortleClass: 4.3,
		sqmMagArcsec2: 21.28,
		lightPollutionYear: 2024,
		opennessScore: 9.4,
		accessScore: 6.2,
		description: '산 능선과 초지가 넓게 열려 있어 별 사진 촬영지로 자주 찾는 곳입니다.',
		document:
			'육백마지기는 평창 청옥산 일대의 넓은 초지와 능선 지형이 특징이다. 하늘이 크게 열려 있어 별 사진 구도를 잡기 좋지만, 바람과 야간 도로 상황을 확인하는 편이 좋다.',
		tags: ['고지대', '초지', '탁 트임']
	},
	{
		name: '별마로천문대 일대',
		province: '강원도',
		city: '영월군',
		latitude: 37.193393,
		longitude: 128.495475,
		siteScore: 29,
		elevationM: 799,
		lightPollutionScore: 6.3,
		bortleClass: 5.1,
		sqmMagArcsec2: 20.51,
		lightPollutionYear: 2024,
		opennessScore: 8.4,
		accessScore: 7.5,
		description: '도심 불빛에서 떨어진 산 위 관측 환경이라 초보자에게도 기준점으로 잡기 좋습니다.',
		document:
			'별마로천문대는 영월 봉래산 정상 부근에 있어 관측 목적지로 설명하기 쉽다. 천문대 인근이라는 장점이 있고 접근성이 비교적 좋지만, 방문 가능 시간과 주변 통제 여부를 확인해야 한다.',
		tags: ['천문대', '어두움', '접근성']
	},
	{
		name: '태백 매봉산 바람의 언덕',
		province: '강원도',
		city: '태백시',
		latitude: 37.2112,
		longitude: 128.966903,
		siteScore: 28,
		elevationM: 1270,
		lightPollutionScore: 6.6,
		bortleClass: 5.0,
		sqmMagArcsec2: 20.62,
		lightPollutionYear: 2024,
		opennessScore: 9,
		accessScore: 6.1,
		description: '주변 광해가 적고 능선 시야가 넓어 밤하늘을 크게 보기 좋은 편입니다.',
		document:
			'태백 매봉산 바람의 언덕은 고도와 능선 시야가 장점이다. 풍력발전기와 능선 풍경이 있어 사진 구도는 좋지만, 강풍과 기온 저하를 감안해야 한다.',
		tags: ['능선', '어두움', '탁 트임']
	},
	{
		name: '조경철천문대 인근',
		province: '강원도',
		city: '화천군',
		latitude: 38.1157762,
		longitude: 127.4445784,
		siteScore: 28,
		elevationM: 1010,
		lightPollutionScore: 6.9,
		bortleClass: 4.8,
		sqmMagArcsec2: 20.75,
		lightPollutionYear: 2024,
		opennessScore: 8,
		accessScore: 6.6,
		description: '북부 산악 지역이라 광해가 적고 천문 관측 목적지로 쓰기 좋습니다.',
		document:
			'조경철천문대 인근은 화천 산악 지역의 어두운 하늘을 기대할 수 있는 후보지다. 천문대 주변 특성상 관측 목적 설명이 명확하지만, 야간 출입과 도로 상황을 확인해야 한다.',
		tags: ['천문대', '어두움', '산악']
	},
	{
		name: '무주 덕유산 자락',
		province: '전라북도',
		city: '무주군',
		latitude: 35.8837985,
		longitude: 127.7236672,
		siteScore: 27,
		elevationM: 900,
		lightPollutionScore: 7.1,
		bortleClass: 4.8,
		sqmMagArcsec2: 20.85,
		lightPollutionYear: 2024,
		opennessScore: 7.8,
		accessScore: 6.8,
		description: '산악 지형과 낮은 광해 덕분에 남부권 관측 후보로 잡기 좋습니다.',
		document:
			'무주 덕유산 자락은 남부권에서 산악 지형과 비교적 낮은 광해를 기대할 수 있는 후보지다. 계절에 따라 안개와 구름 변화가 있어 예보 확인이 중요하다.',
		tags: ['산악', '어두움', '남부권']
	},
	{
		name: '보은 속리산 말티재 일대',
		province: '충청북도',
		city: '보은군',
		latitude: 36.5027,
		longitude: 127.8054,
		siteScore: 25,
		elevationM: 430,
		lightPollutionScore: 6.4,
		bortleClass: 5.0,
		sqmMagArcsec2: 20.54,
		lightPollutionYear: 2024,
		opennessScore: 7.3,
		accessScore: 7.2,
		description: '내륙 산지라 주변 조명이 비교적 적고 중부권에서 접근성이 괜찮습니다.',
		document:
			'보은 속리산 말티재 일대는 중부권에서 접근성을 챙기면서 도심 광해를 어느 정도 피할 수 있는 후보지다. 고지대 명소보다는 날씨와 현장 시야 확인이 더 중요하다.',
		tags: ['내륙', '산지', '중부권']
	},
	{
		name: '제주 1100고지',
		province: '제주특별자치도',
		city: '서귀포시',
		latitude: 33.3578491,
		longitude: 126.4624245,
		siteScore: 27,
		elevationM: 1100,
		lightPollutionScore: 6.2,
		bortleClass: 5.0,
		sqmMagArcsec2: 20.46,
		lightPollutionYear: 2025,
		opennessScore: 8.2,
		accessScore: 6.7,
		description: '고도가 높고 하늘이 열려 있지만, 제주 특성상 구름 변화가 빨라 예보 확인이 중요합니다.',
		document:
			'제주 1100고지는 한라산 중산간 고지대라 시야와 고도 면에서 장점이 있다. 다만 제주 산간은 구름과 안개 변화가 빠르므로 실시간 예보와 도로 통제를 확인해야 한다.',
		tags: ['고지대', '제주', '탁 트임']
	},
	{
		name: '새별오름',
		province: '제주특별자치도',
		city: '제주시',
		latitude: 33.3662548,
		longitude: 126.3576883,
		siteScore: 24,
		elevationM: 519,
		lightPollutionScore: 5.6,
		bortleClass: 5.3,
		sqmMagArcsec2: 20.23,
		lightPollutionYear: 2025,
		opennessScore: 8.5,
		accessScore: 7.4,
		description: '오름 지형으로 시야가 트여 있어 제주 서쪽 관측 후보로 보기 좋습니다.',
		document:
			'새별오름은 제주 서쪽 오름 지형으로 시야가 트인 편이다. 접근성은 괜찮지만 주변 행사, 주차, 안전 동선과 구름 예보를 확인하는 것이 좋다.',
		tags: ['오름', '제주', '탁 트임']
	}
];

function normalizeTags(tags) {
	if (Array.isArray(tags)) return tags.filter(Boolean);
	if (typeof tags === 'string') {
		return tags
			.split(',')
			.map((tag) => tag.trim())
			.filter(Boolean);
	}
	return [];
}

function normalizePlace(row) {
	return {
		name: row.name,
		province: row.province,
		city: row.city,
		latitude: row.latitude,
		longitude: row.longitude,
		siteScore: row.siteScore ?? 0,
		elevationM: row.elevationM ?? null,
		lightPollutionScore: row.lightPollutionScore ?? null,
		bortleClass: row.bortleClass ?? null,
		sqmMagArcsec2: row.sqmMagArcsec2 ?? null,
		lightPollutionYear: row.lightPollutionYear ?? null,
		opennessScore: row.opennessScore ?? null,
		accessScore: row.accessScore ?? null,
		description: row.description ?? '',
		document: row.document ?? '',
		tags: normalizeTags(row.tags)
	};
}

export async function getObservingCandidates() {
	try {
		const places = await db.observingPlace.findMany({
			where: { isActive: true },
			orderBy: { siteScore: 'desc' }
		});

		return places.length ? places.map(normalizePlace) : FALLBACK_OBSERVING_PLACES;
	} catch (error) {
		console.warn('MySQL observing places unavailable, using fallback places:', error.message);
		return FALLBACK_OBSERVING_PLACES;
	}
}
