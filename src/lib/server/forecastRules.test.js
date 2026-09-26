import { describe, expect, it } from 'vitest';
import {
	CACHE_TTL_MS,
	hasFreshRows,
	normalizeAmount,
	precipitationText,
	scoreObservationRows,
	skyText,
	summarizeObservation,
	summarizeWeatherItems,
	toForecastRow
} from './forecastRules.js';

const location = { province: '강원도', city: '강릉시', latitude: 37.75, longitude: 128.87 };

function item(category, fcstValue, fcstTime = '2100', fcstDate = '20260927') {
	return { category, fcstValue, fcstDate, fcstTime };
}

function row(overrides = {}) {
	return {
		forecast_time: '2100',
		sky: 1,
		sky_text: '맑음',
		precipitation_type: 0,
		precipitation_text: '없음',
		precipitation_probability: 0,
		humidity: 60,
		is_observable: true,
		...overrides
	};
}

describe('기상청 코드 해석', () => {
	it('하늘 상태와 강수 형태 코드를 한글로 바꾼다', () => {
		expect(skyText('1')).toBe('맑음');
		expect(skyText(4)).toBe('흐림');
		expect(skyText('9')).toBe('-');
		expect(precipitationText('0')).toBe('없음');
		expect(precipitationText('4')).toBe('소나기');
	});
});

describe('summarizeWeatherItems', () => {
	it('시간마다 흩어진 항목을 한 행으로 묶고 관측 가능 여부를 판정한다', () => {
		const rows = summarizeWeatherItems(
			[
				item('TMP', '18'),
				item('SKY', '1'),
				item('PTY', '0'),
				item('POP', '10'),
				item('REH', '70'),
				item('PCP', '강수없음'),
				item('SKY', '4', '2200'),
				item('PTY', '1', '2200')
			],
			location,
			'2026-09-27T12:00:00.000Z'
		);

		expect(rows).toHaveLength(2);
		expect(rows[0]).toMatchObject({
			location_name: '강원도 강릉시',
			forecast_time: '2100',
			temperature: 18,
			sky_text: '맑음',
			precipitation_probability: 10,
			humidity: 70,
			precipitation_amount: '강수없음',
			is_observable: true,
			fetched_at: '2026-09-27T12:00:00.000Z'
		});
		expect(rows[1]).toMatchObject({
			forecast_time: '2200',
			sky_text: '흐림',
			precipitation_text: '비',
			is_observable: false
		});
	});

	it('구름이 적어도 비가 오면 관측 불리로 본다', () => {
		const [result] = summarizeWeatherItems([item('SKY', '2'), item('PTY', '4')], location);
		expect(result.is_observable).toBe(false);
	});
});

describe('hasFreshRows', () => {
	const now = Date.parse('2026-09-27T12:00:00Z');

	it('이른 시간대 행이 오래됐어도 가장 최근에 받은 행이 두 시간 안이면 신선하다', () => {
		const rows = [
			{ fetched_at: new Date(now - CACHE_TTL_MS - 60_000) },
			{ fetched_at: new Date(now - 10 * 60_000) }
		];
		expect(hasFreshRows(rows, now)).toBe(true);
	});

	it('모두 오래됐거나 비어 있거나 시각을 읽을 수 없으면 새로 받아야 한다', () => {
		expect(hasFreshRows([{ fetched_at: new Date(now - CACHE_TTL_MS - 1) }], now)).toBe(false);
		expect(hasFreshRows([], now)).toBe(false);
		expect(hasFreshRows([{ fetched_at: 'invalid' }], now)).toBe(false);
	});
});

describe('scoreObservationRows', () => {
	it('관측 유리 시간이 많은 곳이 장소 점수가 조금 낮아도 앞선다', () => {
		const clear = scoreObservationRows([row(), row({ forecast_time: '2200' })], 20);
		const cloudy = scoreObservationRows(
			[
				row({ sky: 4, is_observable: false, precipitation_probability: 60 }),
				row({ forecast_time: '2200', sky: 3, is_observable: false })
			],
			30
		);

		expect(clear).toMatchObject({ verdict: 'good', recommendedTimes: ['2100', '2200'] });
		expect(cloudy.verdict).toBe('bad');
		expect(clear.score).toBeGreaterThan(cloudy.score);
	});

	it('일부 시간만 유리하면 mixed', () => {
		const result = scoreObservationRows([row(), row({ forecast_time: '2200', sky: 4, is_observable: false })]);
		expect(result).toMatchObject({ verdict: 'mixed', observableCount: 1, recommendedTimes: ['2100'] });
	});

	it('예보가 없는 후보는 순위 맨 뒤로 밀어낸다', () => {
		expect(scoreObservationRows([], 30)).toMatchObject({ score: -969, verdict: 'bad', recommendedTimes: [] });
	});
});

describe('summarizeObservation', () => {
	it('불리한 이유를 중복 없이 모아 알려준다', () => {
		const summary = summarizeObservation([
			row({ sky: 4, sky_text: '흐림', is_observable: false }),
			row({ forecast_time: '2200', sky: 4, sky_text: '흐림', is_observable: false, precipitation_probability: 70 })
		]);
		expect(summary).toBe('조회한 시간대는 관측에 불리합니다. 주요 이유: 흐림, 흐림/강수확률 70%');
	});

	it('유리한 시간을 추천 시간대로 알려준다', () => {
		expect(summarizeObservation([row(), row({ forecast_time: '2200' })])).toBe(
			'조회한 시간대 전부 관측에 비교적 유리합니다. 추천 시간대: 2100, 2200'
		);
		expect(summarizeObservation([])).toContain('판정할 수 없습니다');
	});
});

describe('toForecastRow', () => {
	it("기상청 가이드대로 강수량·적설량의 '-', null, 0은 '없음' 문구로 바꾼다", () => {
		expect(normalizeAmount('0', '강수없음')).toBe('강수없음');
		expect(normalizeAmount(null, '적설없음')).toBe('적설없음');
		expect(normalizeAmount('1mm 미만', '강수없음')).toBe('1mm 미만');

		const result = toForecastRow(row({ precipitation_amount: '0', snowfall: '-', temperature: 18 }));
		expect(result).toMatchObject({
			time: '2100',
			temperature: 18,
			precipitationAmount: '강수없음',
			snowfall: '적설없음',
			observable: true
		});
	});
});
