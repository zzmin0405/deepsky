import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: { DATA_GO_KR_SERVICE_KEY: 'abc/def==' } }));

const { getBaseDateTime, getWeather, getWeatherGrid } = await import('./weather.js');

function jsonResponse(body, init = {}) {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
		...init
	});
}

describe('getBaseDateTime', () => {
	it.each([
		['2026-09-27T14:30:00Z', '20260927', '2300', '한국 23:30 → 당일 23시 발표분'],
		['2026-09-27T16:05:00Z', '20260927', '2300', '한국 01:05 → 02:10 전이라 전날 23시 발표분'],
		['2026-09-27T17:15:00Z', '20260928', '0200', '한국 02:15 → 02시 발표분'],
		['2026-09-27T23:05:00Z', '20260928', '0500', '한국 08:05 → 08:10 전이라 05시 발표분'],
		['2026-09-27T23:10:00Z', '20260928', '0800', '한국 08:10 → 08시 발표분']
	])('%s', (instant, baseDate, baseTime) => {
		expect(getBaseDateTime(new Date(instant))).toEqual({ base_date: baseDate, base_time: baseTime });
	});
});

describe('getWeatherGrid', () => {
	it('기상청 격자표의 좌표로 변환한다', () => {
		expect(getWeatherGrid(37.5729503, 126.9793579)).toEqual({ nx: 60, ny: 127 }); // 서울 종로구
		expect(getWeatherGrid(35.10321, 129.03004)).toEqual({ nx: 97, ny: 74 }); // 부산 중구
	});
});

describe('getWeather', () => {
	it('https로 요청하고 서비스 키를 한 번만 인코딩해 보낸다', async () => {
		const fetchMock = vi.fn(async () =>
			jsonResponse({
				response: {
					header: { resultCode: '00' },
					body: { items: { item: [{ category: 'SKY', fcstValue: '1' }] } }
				}
			})
		);
		vi.stubGlobal('fetch', fetchMock);

		const items = await getWeather(37.5729503, 126.9793579);

		expect(items).toEqual([{ category: 'SKY', fcstValue: '1' }]);
		const url = new URL(fetchMock.mock.calls[0][0]);
		expect(url.protocol).toBe('https:');
		expect(url.search).toContain('serviceKey=abc%2Fdef%3D%3D');
		expect(url.searchParams.get('nx')).toBe('60');
		expect(url.searchParams.get('ny')).toBe('127');
	});

	it('기상청 오류 코드는 예외로 알리고 로그에 요청 URL을 남기지 않는다', async () => {
		vi.stubGlobal('fetch', async () =>
			jsonResponse({ response: { header: { resultCode: '03', resultMsg: 'NO_DATA' } } })
		);
		const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});

		await expect(getWeather(37.5, 127)).rejects.toThrow('NO_DATA');
		expect(errorLog.mock.calls.flat().join(' ')).not.toContain('serviceKey');
	});

	it('키 오류처럼 XML로 오는 응답은 형식 오류로 처리한다', async () => {
		vi.stubGlobal('fetch', async () => new Response('<OpenAPI_ServiceResponse/>', { status: 200 }));
		vi.spyOn(console, 'error').mockImplementation(() => {});

		await expect(getWeather(37.5, 127)).rejects.toThrow('알 수 없는 응답 형식');
	});
});
