import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/weatherContext', () => ({
	buildForecastTimeline: vi.fn(async (location) => ({
		location,
		days: [
			{
				date: '20260928',
				label: '내일',
				rows: [
					{
						forecast_time: '2100',
						sky: 1,
						sky_text: '맑음',
						precipitation_type: 0,
						precipitation_text: '없음',
						precipitation_probability: 0,
						precipitation_amount: '0',
						snowfall: null,
						humidity: 70,
						temperature: 18,
						is_observable: true
					}
				]
			}
		]
	}))
}));

const { GET } = await import('./+server.js');
const { buildForecastTimeline } = await import('$lib/server/weatherContext');

function forecastEvent(query, address = 'forecast-test') {
	return {
		url: new URL(`http://localhost/api/forecast?${new URLSearchParams(query)}`),
		getClientAddress: () => address
	};
}

describe('GET /api/forecast', () => {
	it('지역 목록에 없는 지역은 400으로 거절한다', async () => {
		const response = await GET(forecastEvent({ province: 'x', city: 'y' }));
		expect(response.status).toBe(400);
	});

	it('예보 행을 화면용 형식으로 바꿔 돌려준다', async () => {
		const response = await GET(forecastEvent({ province: '강원도', city: '강릉시' }));
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.location).toEqual({ province: '강원도', city: '강릉시' });
		expect(body.days[0].rows[0]).toMatchObject({
			time: '2100',
			precipitationAmount: '강수없음',
			snowfall: '적설없음',
			observable: true
		});
	});

	it('예보를 하나도 가져오지 못하면 503으로 알린다', async () => {
		buildForecastTimeline.mockResolvedValueOnce({
			location: {},
			days: [{ date: '20260928', label: '내일', rows: [] }]
		});
		const response = await GET(forecastEvent({ province: '강원도', city: '강릉시' }));
		expect(response.status).toBe(503);
	});

	it('같은 IP의 과도한 요청은 429로 막는다', async () => {
		for (let count = 0; count < 30; count += 1) {
			await GET(forecastEvent({ province: 'x', city: 'y' }, 'forecast-burst'));
		}
		const response = await GET(forecastEvent({ province: 'x', city: 'y' }, 'forecast-burst'));
		expect(response.status).toBe(429);
	});
});
