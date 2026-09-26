import { json } from '@sveltejs/kit';
// 비밀값은 빌드 산출물에 박히지 않도록 실행 시점 환경 변수로 읽습니다.
import { env } from '$env/dynamic/private';
import {
	CHAT_SYSTEM_PROMPT,
	buildFallbackPayload,
	buildRecommendationAnswer,
	buildRecommendationCard,
	buildUserPrompt,
	buildWeatherCard
} from '$lib/server/chatResponses';
import { generateGeminiText, resolveGeminiModel } from '$lib/server/gemini';
import { shouldUseRecommendation, shouldUseWeatherContext } from '$lib/server/questionIntent';
import { checkRateLimit, getClientAddress, rateLimitHeaders } from '$lib/server/rateLimit';
import { buildBestObservationRecommendation, buildWeatherRagContext } from '$lib/server/weatherContext';

const MAX_MESSAGE_LENGTH = 2000;
let missingApiKeyWarned = false;

export async function POST(event) {
	const rateLimit = checkRateLimit('chat', getClientAddress(event), { limit: 20 });
	if (!rateLimit.allowed) {
		return json(
			{ error: true, message: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
			{ status: 429, headers: rateLimitHeaders(rateLimit) }
		);
	}

	let rag = null;
	try {
		let payload;
		try {
			payload = await event.request.json();
		} catch {
			return json({ error: true, message: '올바른 JSON 요청을 보내 주세요.' }, { status: 400 });
		}

		const { message, userLocation } = payload || {};
		if (typeof message !== 'string' || !message.trim() || message.length > MAX_MESSAGE_LENGTH) {
			return json(
				{ error: true, message: '질문은 1자 이상 2,000자 이하로 입력해 주세요.' },
				{ status: 400 }
			);
		}

		// 장소 추천은 여러 후보의 예보를 비교하는 결정론적 계산으로 답합니다.
		if (shouldUseRecommendation(message)) {
			const recommendation = await buildBestObservationRecommendation(message, userLocation);
			return json({
				response: buildRecommendationAnswer(recommendation),
				recommendationCard: buildRecommendationCard(recommendation),
				fallback: true,
				message: '여러 후보 지역의 예보 데이터를 비교해 추천했습니다.'
			});
		}

		if (shouldUseWeatherContext(message)) {
			rag = await buildWeatherRagContext(message, userLocation);
		}

		const apiKey = env.GEMINI_API_KEY;
		if (!apiKey) {
			if (!missingApiKeyWarned) {
				console.warn('GEMINI_API_KEY가 없어 LLM 없이 대체 응답을 사용합니다.');
				missingApiKeyWarned = true;
			}
			return json(buildFallbackPayload(rag));
		}

		const model = resolveGeminiModel(env.GEMINI_MODEL);
		const result = await generateGeminiText({
			apiKey,
			model,
			systemPrompt: CHAT_SYSTEM_PROMPT,
			userPrompt: buildUserPrompt(message, rag)
		});

		if (!result.ok) {
			console.error('Gemini API Error:', {
				model,
				status: result.status,
				statusText: result.statusText,
				error: result.errorMessage
			});
			return json(
				buildFallbackPayload(
					rag,
					rag ? 'Gemini API가 응답하지 않아 날씨 예보 기반 요약으로 답변했습니다.' : undefined
				)
			);
		}

		if (!result.text) {
			console.error('Gemini 응답에 텍스트가 없습니다:', {
				model,
				finishReason: result.finishReason,
				blockReason: result.blockReason
			});
			return json(buildFallbackPayload(rag));
		}

		return json({ response: result.text, weatherCard: buildWeatherCard(rag) });
	} catch (error) {
		// 네트워크 오류·타임아웃도 예보를 확보했다면 그 내용으로 답합니다.
		console.error('Chat response error:', error.message);
		return json(buildFallbackPayload(rag));
	}
}
