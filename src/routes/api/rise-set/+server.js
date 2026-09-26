import { json } from '@sveltejs/kit';
import { addDays, format } from 'date-fns';
import { kstToday } from '$lib/kst';
import { getMoonRiseSet } from '$lib/server/moonRiseSet';
import { checkRateLimit, getClientAddress, rateLimitHeaders } from '$lib/server/rateLimit';

// 홈 화면은 서울 기준 출몰시각을 보여줍니다.
const SEOUL = { latitude: 37.5665, longitude: 126.978 };
const MAX_DAY_OFFSET = 2;

export async function GET(event) {
	const rateLimit = checkRateLimit('rise-set', getClientAddress(event), { limit: 30 });
	if (!rateLimit.allowed) {
		return json(
			{ error: true, message: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
			{ status: 429, headers: rateLimitHeaders(rateLimit) }
		);
	}

	const day = Number(event.url.searchParams.get('day') ?? 0);
	if (!Number.isInteger(day) || day < 0 || day > MAX_DAY_OFFSET) {
		return json({ error: true, message: '조회할 날짜가 올바르지 않습니다.' }, { status: 400 });
	}

	const locdate = format(addDays(kstToday(), day), 'yyyyMMdd');

	try {
		const times = await getMoonRiseSet(SEOUL.latitude, SEOUL.longitude, locdate);
		return json({ date: locdate, location: '서울', ...times });
	} catch (error) {
		console.error('출몰시각 API 오류:', error.message);
		return json(
			{ error: true, message: '출몰시각 정보를 가져오지 못했습니다.' },
			{ status: 503 }
		);
	}
}
