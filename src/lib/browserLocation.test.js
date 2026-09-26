import { describe, expect, it, vi } from 'vitest';
import {
	USER_LOCATION_KEY,
	createLocationResolver,
	readStoredLocation,
	saveUserLocation
} from './browserLocation.js';
import { findClosestLocation, isInKorea } from './geo.js';

function memoryStorage(initial = {}) {
	const data = new Map(Object.entries(initial));
	return {
		getItem: (key) => data.get(key) ?? null,
		setItem: (key, value) => data.set(key, String(value))
	};
}

describe('저장된 위치', () => {
	const now = Date.parse('2026-09-27T12:00:00Z');

	it('저장한 좌표를 30분 동안 다시 쓴다', () => {
		const storage = memoryStorage();
		saveUserLocation({ latitude: 37.57, longitude: 126.98 }, storage, now);

		expect(readStoredLocation(storage, now + 29 * 60_000)).toEqual({ latitude: 37.57, longitude: 126.98 });
		expect(readStoredLocation(storage, now + 31 * 60_000)).toBeNull();
	});

	it('형식이 깨졌거나 한반도 밖 좌표는 버린다', () => {
		expect(readStoredLocation(memoryStorage({ [USER_LOCATION_KEY]: '{broken' }), now)).toBeNull();

		const abroad = memoryStorage({
			[USER_LOCATION_KEY]: JSON.stringify({ latitude: 35.68, longitude: 139.76, updatedAt: now })
		});
		expect(readStoredLocation(abroad, now)).toBeNull();
	});

	it('저장소를 쓸 수 없어도 예외를 던지지 않는다', () => {
		const failing = {
			setItem: () => {
				throw new Error('QuotaExceededError');
			}
		};
		expect(() => saveUserLocation({ latitude: 37, longitude: 127 }, failing, now)).not.toThrow();
	});
});

describe('createLocationResolver', () => {
	it('동시에 여러 번 물어도 위치 권한은 한 번만 요청하고 결과를 재사용한다', async () => {
		const getCurrentPosition = vi.fn((resolve) => resolve({ coords: { latitude: 37.5, longitude: 127 } }));
		vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
		vi.stubGlobal('localStorage', memoryStorage());

		const resolveLocation = createLocationResolver();
		const [first, second] = await Promise.all([resolveLocation(), resolveLocation()]);
		const third = await resolveLocation();

		expect(first).toEqual({ latitude: 37.5, longitude: 127 });
		expect(second).toEqual(first);
		expect(third).toEqual(first);
		expect(getCurrentPosition).toHaveBeenCalledTimes(1);
	});

	it('권한을 거부하면 위치 없이 진행하도록 null을 돌려준다', async () => {
		vi.stubGlobal('navigator', {
			geolocation: { getCurrentPosition: (_resolve, reject) => reject(new Error('denied')) }
		});
		vi.stubGlobal('localStorage', memoryStorage());

		expect(await createLocationResolver()()).toBeNull();
	});
});

describe('geo', () => {
	it('한반도 범위의 숫자 좌표만 허용한다', () => {
		expect(isInKorea({ latitude: 33.5, longitude: 126.5 })).toBe(true);
		expect(isInKorea({ latitude: 35.68, longitude: 139.76 })).toBe(false);
		expect(isInKorea({ latitude: Number.NaN, longitude: 127 })).toBe(false);
	});

	it('가장 가까운 지역을 고른다', () => {
		const candidates = [
			{ city: '서울', latitude: 37.5, longitude: 127 },
			{ city: '부산', latitude: 35.1, longitude: 129 }
		];
		expect(findClosestLocation(35.2, 128.9, candidates).city).toBe('부산');
		expect(findClosestLocation(37, 127, [])).toBeNull();
	});
});
