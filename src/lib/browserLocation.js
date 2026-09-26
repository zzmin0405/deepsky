// 브라우저 위치 권한과 최근 위치 저장을 다룹니다. 홈에서 얻은 위치를 챗봇이 이어서 씁니다.
import { isInKorea } from '$lib/geo';

export const USER_LOCATION_KEY = 'deepsky:user-location';
const STORED_LOCATION_MAX_AGE_MS = 30 * 60 * 1000;

export function saveUserLocation({ latitude, longitude }, storage = globalThis.localStorage, now = Date.now()) {
	try {
		storage?.setItem(USER_LOCATION_KEY, JSON.stringify({ latitude, longitude, updatedAt: now }));
	} catch {
		// 저장소를 쓸 수 없는 브라우저에서는 필요할 때 위치를 다시 확인합니다.
	}
}

// 30분 안에 저장된 한반도 범위 좌표만 돌려줍니다.
export function readStoredLocation(storage = globalThis.localStorage, now = Date.now()) {
	try {
		const stored = JSON.parse(storage?.getItem(USER_LOCATION_KEY) || 'null');
		const isFresh = Boolean(stored?.updatedAt) && now - stored.updatedAt < STORED_LOCATION_MAX_AGE_MS;
		const coordinates = { latitude: Number(stored?.latitude), longitude: Number(stored?.longitude) };
		return isFresh && isInKorea(coordinates) ? coordinates : null;
	} catch {
		return null;
	}
}

// 권한 거부·시간 초과·미지원 환경에서는 null로 끝나므로 호출하는 쪽은 위치 없이 계속 진행하면 됩니다.
export function requestCurrentPosition(options) {
	if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null);

	return new Promise((resolve) => {
		navigator.geolocation.getCurrentPosition(
			(position) =>
				resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
			() => resolve(null),
			options
		);
	});
}

// 질문할 때마다 위치를 다시 묻지 않도록 얻은 좌표나 진행 중인 요청을 재사용합니다.
export function createLocationResolver() {
	let cached = null;
	let pending = null;

	return function resolveLocation() {
		if (cached) return Promise.resolve(cached);

		const stored = readStoredLocation();
		if (stored) {
			cached = stored;
			return Promise.resolve(stored);
		}

		pending ??= requestCurrentPosition({
			enableHighAccuracy: false,
			timeout: 5000,
			maximumAge: 5 * 60 * 1000
		}).then((coordinates) => (cached = coordinates));
		return pending;
	};
}
