import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ForecastTimeline from './ForecastTimeline.svelte';

function forecastRow(overrides) {
	return {
		time: '2100',
		observable: true,
		sky: 1,
		skyText: '맑음',
		precipitationType: 0,
		precipitationText: '없음',
		precipitationProbability: 0,
		precipitationAmount: '강수없음',
		snowfall: '적설없음',
		humidity: 70,
		temperature: 18,
		...overrides
	};
}

const forecast = {
	location: { province: '강원도', city: '강릉시' },
	days: [
		{ date: '20260927', label: '오늘', rows: [] },
		{
			date: '20260928',
			label: '내일',
			rows: [
				forecastRow({ time: '1300', temperature: 24 }),
				forecastRow({ time: '2100' }),
				forecastRow({
					time: '2200',
					observable: false,
					sky: 4,
					skyText: '흐림',
					precipitationType: 1,
					precipitationText: '비',
					precipitationAmount: '1mm 미만'
				})
			]
		},
		{ date: '20260929', label: '모레', rows: [] }
	]
};

describe('ForecastTimeline', () => {
	it('예보가 있는 첫 날짜를 고르고 밤 시간에만 관측 판정을 붙인다', () => {
		const { body } = render(ForecastTimeline, { props: { forecast } });

		expect(body).toContain('강원도 강릉시');
		expect(body).toContain('내일 밤·새벽 중 관측 유리 시간');
		expect(body).toContain('21시');
		expect(body).toContain('관측 유리');
		expect(body).toContain('관측 불리');
		// 13시는 맑아도 낮이라 관측 판정 대신 낮 시간으로 표시합니다.
		expect(body).toContain('낮 시간');
		// 강수량은 선택한 시간이 아니라 각 칸의 기상청 값을 그대로 보여줍니다.
		expect(body).toContain('1mm 미만');
	});

	it('밤 시간 예보가 모두 불리하면 불리하다고 요약한다', () => {
		const cloudy = {
			...forecast,
			days: [{ date: '20260928', label: '내일', rows: [forecastRow({ observable: false, sky: 4 })] }]
		};
		const { body } = render(ForecastTimeline, { props: { forecast: cloudy } });
		expect(body).toContain('내일 밤·새벽 시간대는 관측에 불리한 예보입니다.');
	});
});
