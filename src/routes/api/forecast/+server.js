import { json } from '@sveltejs/kit';
import { toForecastRow } from '$lib/server/forecastRules';
import { findLocationByName } from '$lib/server/questionIntent';
import { checkRateLimit, getClientAddress, rateLimitHeaders } from '$lib/server/rateLimit';
import { buildForecastTimeline } from '$lib/server/weatherContext';

// 홈 화면의 시간대별 예보입니다. 기상청 호출과 서비스 키는 서버에만 두고 캐시 경로를 거칩니다.
export async function GET(event) {
	const rateLimit = checkRateLimit('forecast', getClientAddress(event), { limit: 30 });
	if (!rateLimit.allowed) {
		return json(
			{ error: true, message: '예보 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
			{ status: 429, headers: rateLimitHeaders(rateLimit) }
		);
	}

	const province = event.url.searchParams.get('province') || '';
	const city = event.url.searchParams.get('city') || '';
	const location = findLocationByName(province, city);
	if (!location) {
		return json({ error: true, message: '지원하지 않는 지역입니다.' }, { status: 400 });
	}

	try {
		const forecast = await buildForecastTimeline(location);
		if (!forecast.days.some((day) => day.rows.length)) {
			return json(
				{ error: true, message: '예보 데이터를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.' },
				{ status: 503 }
			);
		}

		return json({
			location: { province: location.province, city: location.city },
			days: forecast.days.map((day) => ({
				date: day.date,
				label: day.label,
				rows: day.rows.map(toForecastRow)
			}))
		});
	} catch (error) {
		console.error('예보 API 오류:', error.message);
		return json({ error: true, message: '예보 데이터를 가져오지 못했습니다.' }, { status: 500 });
	}
}
