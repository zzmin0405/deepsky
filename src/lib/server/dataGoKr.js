import { env } from '$env/dynamic/private';

// 공공데이터포털(data.go.kr) 서비스 키는 "인코딩"·"디코딩" 두 형태로 발급됩니다.
// 어느 쪽을 환경 변수에 넣어도 URL에는 한 번만 인코딩된 값이 들어가도록 맞춥니다.
export function getDataGoKrServiceKey() {
	const raw = String(env.DATA_GO_KR_SERVICE_KEY || '').trim();
	if (!raw) {
		throw new Error('DATA_GO_KR_SERVICE_KEY 환경 변수가 설정되지 않았습니다.');
	}

	try {
		return encodeURIComponent(decodeURIComponent(raw));
	} catch {
		return encodeURIComponent(raw);
	}
}
