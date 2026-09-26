// 좌표 관련 도우미입니다. 브라우저 위치를 예보 지역 목록과 맞출 때 씁니다.

// 한반도와 제주를 포함하는 대략적인 범위입니다. 서버도 같은 범위로 좌표를 검증합니다.
export function isInKorea({ latitude, longitude }) {
	return (
		Number.isFinite(latitude) &&
		Number.isFinite(longitude) &&
		latitude >= 33 &&
		latitude <= 39 &&
		longitude >= 124 &&
		longitude <= 132
	);
}

// 가까운 지역을 고르는 비교용이라 제곱 거리만 써도 순서는 같습니다.
export function findClosestLocation(latitude, longitude, candidates) {
	let closest = null;
	let minDistance = Infinity;

	for (const location of candidates) {
		const distance = (latitude - location.latitude) ** 2 + (longitude - location.longitude) ** 2;
		if (distance < minDistance) {
			minDistance = distance;
			closest = location;
		}
	}

	return closest;
}
