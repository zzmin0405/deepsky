import { describe, expect, it } from 'vitest';
import {
	HOURS,
	favorableNightTimes,
	formatHour,
	formatValue,
	isNightTime,
	weatherIcon
} from './forecastDisplay.js';

describe('isNightTime', () => {
	it.each([
		['0000', true],
		['0500', true],
		['0600', false],
		['1800', false],
		['1900', true],
		['2300', true]
	])('%s → %s', (time, expected) => {
		expect(isNightTime(time)).toBe(expected);
	});
});

describe('표시 형식', () => {
	it('24시간 칸을 00~23으로 만든다', () => {
		expect(HOURS).toHaveLength(24);
		expect(HOURS[0]).toBe('00');
		expect(HOURS[23]).toBe('23');
	});

	it('시각과 값을 화면용 문자열로 바꾼다', () => {
		expect(formatHour('2100')).toBe('21시');
		expect(formatValue(18, '°C')).toBe('18°C');
		expect(formatValue(0, '%')).toBe('0%');
		expect(formatValue(null, '%')).toBe('-');
		expect(formatValue('')).toBe('-');
	});
});

describe('favorableNightTimes', () => {
	it('낮에 맑은 시간은 빼고 밤·새벽의 유리한 시간만 고른다', () => {
		const rows = [
			{ time: '1300', observable: true },
			{ time: '2100', observable: true },
			{ time: '2200', observable: false },
			{ time: '0300', observable: true }
		];
		expect(favorableNightTimes(rows)).toEqual(['2100', '0300']);
	});
});

describe('weatherIcon', () => {
	it('강수가 있으면 하늘 상태보다 강수 아이콘을 먼저 보여준다', () => {
		expect(weatherIcon({ sky: 1, precipitationType: 1 }, '2100')).toBe('🌧️');
		expect(weatherIcon({ sky: 1, precipitationType: 0 }, '2100')).toBe('🌙');
		expect(weatherIcon({ sky: 1, precipitationType: 0 }, '1200')).toBe('☀️');
		expect(weatherIcon({ sky: 3, precipitationType: 0 }, '1200')).toBe('⛅');
		expect(weatherIcon(null, '1200')).toBe('');
	});
});
