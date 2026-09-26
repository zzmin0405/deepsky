// Gemini generateContent REST 호출과 응답 해석을 담당합니다.
// 실패는 예외 대신 결과 객체로 돌려줘서, 호출하는 쪽이 예보 기반 대체 응답으로 이어갈 수 있게 합니다.

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
// gemini-2.0-flash는 2026-06-01에 종료됐습니다. GEMINI_MODEL 환경 변수로 바꿀 수 있습니다.
export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
export const GEMINI_TIMEOUT_MS = 15000;
// 추론(thinking) 토큰도 이 한도에 포함되므로 답변이 잘리지 않도록 여유를 둡니다.
const MAX_OUTPUT_TOKENS = 4096;

// URL 경로에 들어가므로 모델 이름에 쓰는 문자만 허용하고, 아니면 기본 모델을 씁니다.
export function resolveGeminiModel(value) {
	const model = String(value || '').trim();
	return /^[\w.-]+$/.test(model) ? model : DEFAULT_GEMINI_MODEL;
}

export function buildGenerationConfig(model) {
	const config = { maxOutputTokens: MAX_OUTPUT_TOKENS };
	// Gemini 3 이후 모델은 thinkingLevel로 추론량을 조절합니다. 채팅은 응답 시간이 중요해 low를 씁니다.
	// 1.x·2.x 모델은 이 옵션을 지원하지 않습니다.
	if (!/^gemini-[12]\./.test(model)) {
		config.thinkingConfig = { thinkingLevel: 'low' };
	}
	return config;
}

// 추론 요약(thought) 파트는 빼고 답변 텍스트만 이어 붙입니다.
export function extractResponseText(data) {
	const parts = data?.candidates?.[0]?.content?.parts;
	if (!Array.isArray(parts)) return '';

	return parts
		.filter((part) => typeof part?.text === 'string' && !part.thought)
		.map((part) => part.text)
		.join('')
		.trim();
}

/**
 * @param {{ apiKey: string, model: string, systemPrompt: string, userPrompt: string, timeoutMs?: number, fetchImpl?: typeof fetch }} options
 */
export async function generateGeminiText({
	apiKey,
	model,
	systemPrompt,
	userPrompt,
	timeoutMs = GEMINI_TIMEOUT_MS,
	fetchImpl = fetch
}) {
	const response = await fetchImpl(`${API_BASE}/${model}:generateContent`, {
		method: 'POST',
		signal: AbortSignal.timeout(timeoutMs),
		headers: {
			'Content-Type': 'application/json',
			'x-goog-api-key': apiKey
		},
		body: JSON.stringify({
			// 시스템 지시는 사용자 입력과 섞이지 않도록 systemInstruction으로 따로 보냅니다.
			systemInstruction: { parts: [{ text: systemPrompt }] },
			contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
			generationConfig: buildGenerationConfig(model)
		})
	});
	const data = await response.json().catch(() => null);

	return {
		ok: response.ok,
		status: response.status,
		statusText: response.statusText,
		text: response.ok ? extractResponseText(data) : '',
		errorMessage: data?.error?.message,
		finishReason: data?.candidates?.[0]?.finishReason,
		blockReason: data?.promptFeedback?.blockReason
	};
}
