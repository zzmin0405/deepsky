import { describe, expect, it } from 'vitest';
import { kstNow, kstParts, kstToday } from './kst.js';

const dateKey = (date) => date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();

describe('kst', () => {
	it('UTC 오후 3시는 한국 시간 자정을 넘긴 다음 날로 계산한다', () => {
		expect(kstParts(new Date('2026-09-27T15:30:00Z'))).toEqual({
			year: 2026,
			month: 9,
			day: 28,
			hour: 0,
			minute: 30
		});
	});

	it('연말 UTC 저녁은 한국에서 새해 첫날이다', () => {
		const parts = kstParts(new Date('2026-12-31T16:00:00Z'));
		expect(parts).toMatchObject({ year: 2027, month: 1, day: 1, hour: 1 });
	});

	it('kstToday는 한국 날짜의 자정을, kstNow는 한국 벽시계 시각을 로컬 필드로 돌려준다', () => {
		const instant = new Date('2026-09-27T20:05:00Z');
		expect(dateKey(kstToday(instant))).toBe(20260928);
		expect(kstToday(instant).getHours()).toBe(0);
		expect(kstNow(instant).getHours()).toBe(5);
		expect(kstNow(instant).getMinutes()).toBe(5);
	});
});
