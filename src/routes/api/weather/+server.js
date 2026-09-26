import { json } from '@sveltejs/kit';
import { checkRateLimit, getClientAddress, rateLimitHeaders } from '$lib/server/rateLimit';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

export async function GET(event) {
    const rateLimit = checkRateLimit('weather', getClientAddress(event), { limit: 30 });
    if (!rateLimit.allowed) {
        return json(
            { error: '날씨 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
            { status: 429, headers: rateLimitHeaders(rateLimit) }
        );
    }

    try {
        const { url } = event;
        const lat = url.searchParams.get('lat');
        const lon = url.searchParams.get('lon');

        if (!lat || !lon) {
            return json({ error: '위치 정보가 필요합니다.' }, { status: 400 });
        }

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=kr`
        );

        if (!response.ok) {
            throw new Error('날씨 정보를 가져올 수 없습니다.');
        }

        const data = await response.json();

        return json({
            location: data.name,
            temperature: Math.round(data.main.temp),
            feelsLike: Math.round(data.main.feels_like),
            description: data.weather[0].description,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
            icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
            clouds: data.clouds.all
        });
    } catch (error) {
        console.error('날씨 API 오류:', error);
        return json({ error: '날씨 정보를 가져오는데 실패했습니다.' }, { status: 500 });
    }
}
