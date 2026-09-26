import { describe, expect, it, vi } from 'vitest';
import {
	DEFAULT_GEMINI_MODEL,
	buildGenerationConfig,
	extractResponseText,
	generateGeminiText,
	resolveGeminiModel
} from './gemini.js';

describe('resolveGeminiModel', () => {
	it('비어 있거나 URL 경로에 쓸 수 없는 이름이면 기본 모델을 쓴다', () => {
		expect(resolveGeminiModel('')).toBe(DEFAULT_GEMINI_MODEL);
		expect(resolveGeminiModel(undefined)).toBe(DEFAULT_GEMINI_MODEL);
		expect(resolveGeminiModel('../v1/evil')).toBe(DEFAULT_GEMINI_MODEL);
		expect(resolveGeminiModel(' gemini-3.8-flash ')).toBe('gemini-3.8-flash');
	});
});

describe('buildGenerationConfig', () => {
	it('Gemini 3 이후 모델에만 thinkingLevel을 넣는다', () => {
		expect(buildGenerationConfig('gemini-3.6-flash').thinkingConfig).toEqual({ thinkingLevel: 'low' });
		expect(buildGenerationConfig('gemini-2.5-flash').thinkingConfig).toBeUndefined();
	});

	it('3.6 이후 모델이 무시하는 temperature는 보내지 않는다', () => {
		expect(buildGenerationConfig('gemini-3.6-flash')).not.toHaveProperty('temperature');
	});
});

describe('extractResponseText', () => {
	it('추론 요약 파트는 빼고 답변 텍스트만 이어 붙인다', () => {
		const data = {
			candidates: [
				{
					content: {
						parts: [{ text: '생각 중', thought: true }, { text: '맑아서 ' }, { text: '관측하기 좋아요.' }]
					}
				}
			]
		};
		expect(extractResponseText(data)).toBe('맑아서 관측하기 좋아요.');
		expect(extractResponseText({})).toBe('');
		expect(extractResponseText(null)).toBe('');
	});
});

describe('generateGeminiText', () => {
	it('시스템 지시를 사용자 입력과 분리해 systemInstruction으로 보낸다', async () => {
		const fetchImpl = vi.fn(async () =>
			Response.json({ candidates: [{ content: { parts: [{ text: '답변' }] } }] })
		);

		const result = await generateGeminiText({
			apiKey: 'test-key',
			model: 'gemini-3.6-flash',
			systemPrompt: '시스템 지시',
			userPrompt: '질문',
			fetchImpl
		});

		expect(result).toMatchObject({ ok: true, text: '답변' });
		const [url, init] = fetchImpl.mock.calls[0];
		expect(url).toMatch(/\/models\/gemini-3\.6-flash:generateContent$/);
		expect(init.headers['x-goog-api-key']).toBe('test-key');
		const body = JSON.parse(init.body);
		expect(body.systemInstruction.parts[0].text).toBe('시스템 지시');
		expect(body.contents).toEqual([{ role: 'user', parts: [{ text: '질문' }] }]);
	});

	it('오류 응답은 예외 대신 결과 객체로 돌려준다', async () => {
		const fetchImpl = async () =>
			Response.json({ error: { message: 'model not found' } }, { status: 404, statusText: 'Not Found' });

		const result = await generateGeminiText({
			apiKey: 'test-key',
			model: 'gemini-2.0-flash',
			systemPrompt: '',
			userPrompt: '',
			fetchImpl
		});

		expect(result).toMatchObject({ ok: false, status: 404, text: '', errorMessage: 'model not found' });
	});
});
