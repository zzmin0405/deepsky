import { json } from '@sveltejs/kit';
import { buildBestObservationRecommendation } from '$lib/server/weatherContext';
import { checkRateLimit, getClientAddress, rateLimitHeaders } from '$lib/server/rateLimit';

const DEFAULT_RECOMMENDATION_MESSAGE = '오늘 별 관측 장소 추천해줘';

function normalizeUserLocation(value) {
	if (!value || typeof value !== 'object') return null;

	const latitude = Number(value.latitude);
	const longitude = Number(value.longitude);
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
	if (latitude < 33 || latitude > 39 || longitude < 124 || longitude > 132) return null;

	return { latitude, longitude };
}

function serializeRecommendation(recommendation) {
	return {
		targetDate: recommendation.targetDate,
		targetTimes: recommendation.targetTimes,
		candidateCount: recommendation.candidateCount,
		locationSource: recommendation.locationSource,
		nearby: recommendation.nearby,
		locationUnavailable: recommendation.locationUnavailable,
		summary: recommendation.summary,
		locations: recommendation.recommendations.map((item, index) => ({
			rank: index + 1,
			name: item.placeName || item.locationName,
			province: item.location.province,
			city: item.location.city,
			latitude: item.location.latitude,
			longitude: item.location.longitude,
			weatherRegion: item.weatherRegion,
			score: item.score,
			verdict: item.verdict,
			recommendedTimes: item.recommendedTimes,
			distanceKm: item.distanceKm
		}))
	};
}

export async function POST(event) {
	const rateLimit = checkRateLimit('recommendations', getClientAddress(event), { limit: 10 });
	if (!rateLimit.allowed) {
		return json(
			{ error: true, message: '추천 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
			{ status: 429, headers: rateLimitHeaders(rateLimit) }
		);
	}

	try {
		const body = await event.request.json();
		const message = String(body?.message || DEFAULT_RECOMMENDATION_MESSAGE).slice(0, 200);
		const userLocation = normalizeUserLocation(body?.userLocation);
		const recommendation = await buildBestObservationRecommendation(message, userLocation);

		if (!recommendation.recommendations?.length) {
			return json(
				{ error: true, message: '현재 추천할 관측지 예보를 충분히 가져오지 못했습니다.' },
				{ status: 503 }
			);
		}

		return json(serializeRecommendation(recommendation));
	} catch (error) {
		console.error('관측지 추천 API 오류:', error);
		return json({ error: true, message: '관측지 추천 중 오류가 발생했습니다.' }, { status: 500 });
	}
}
