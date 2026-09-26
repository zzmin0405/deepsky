import { describe, expect, it } from 'vitest';
import { subjectParticle } from '$lib/korean';
import {
	GENERIC_FALLBACK_ANSWER,
	buildFallbackPayload,
	buildRecommendationAnswer,
	buildUserPrompt,
	buildWeatherCard
} from './chatResponses.js';

const rag = {
	location: { province: '강원도', city: '강릉시' },
	locationMatched: true,
	locationSource: 'message',
	targetDate: '2026-09-28',
	targetTimes: ['2100', '2200'],
	rows: [
		{
			forecast_time: '2100',
			is_observable: true,
			sky_text: '맑음',
			precipitation_text: '없음',
			precipitation_probability: 0,
			humidity: 70,
			temperature: 18
		},
		{
			forecast_time: '2200',
			is_observable: false,
			sky_text: '흐림',
			precipitation_text: '없음',
			precipitation_probability: 30,
			humidity: 80,
			temperature: 17
		}
	],
	summary: '일부 시간대만 관측에 유리합니다. 추천 시간대: 2100',
	context: '- 20260928 2100, 지역: 강원도 강릉시'
};

describe('subjectParticle', () => {
	it('받침 유무에 따라 이/가를 고른다', () => {
		expect(subjectParticle('안반데기')).toBe('가');
		expect(subjectParticle('새별오름')).toBe('이');
		expect(subjectParticle('제주 1100고지')).toBe('가');
		expect(subjectParticle('M31')).toBe('이');
		expect(subjectParticle('')).toBe('이');
	});
});

describe('buildWeatherCard', () => {
	it('일부 시간만 유리하면 mixed로 표시하고 요약의 시각을 "시" 단위로 바꾼다', () => {
		const card = buildWeatherCard(rag);
		expect(card).toMatchObject({
			location: '강원도 강릉시',
			verdict: 'mixed',
			recommendedTimes: ['2100'],
			summary: '일부 시간대만 관측에 유리합니다. 추천 시간대: 21시'
		});
		expect(card.rows[1]).toMatchObject({ time: '2200', observable: false, sky: '흐림' });
	});

	it('예보가 없으면 카드를 만들지 않는다', () => {
		expect(buildWeatherCard({ ...rag, rows: [] })).toBeNull();
		expect(buildWeatherCard(null)).toBeNull();
	});
});

describe('buildRecommendationAnswer', () => {
	const recommendation = {
		targetDate: '2026-09-28',
		nearby: false,
		locationUnavailable: false,
		recommendations: [
			{ placeName: '안반데기', description: '고도가 높습니다.', recommendedTimes: ['2000', '2100'] },
			{ placeName: '새별오름', description: '', recommendedTimes: [] }
		]
	};

	it('추천 날짜를 밝히고 "오늘 밤"이라고 단정하지 않는다', () => {
		const answer = buildRecommendationAnswer(recommendation);
		expect(answer).toContain('2026-09-28 기준으로는 안반데기가 가장 좋아 보여요.');
		expect(answer).toContain('추천 시간대는 20시, 21시입니다.');
		expect(answer).toContain('대안 후보로는 새별오름도 같이 볼 만합니다.');
		expect(answer).not.toContain('오늘 밤');
	});

	it('위치 권한이 없어 "근처"를 못 봤으면 그 사실을 알린다', () => {
		const answer = buildRecommendationAnswer({ ...recommendation, locationUnavailable: true });
		expect(answer).toContain('현재 위치 권한을 받지 못해 전체 관측지를 비교했어요.');
	});

	it('추천 후보가 없으면 다시 시도하라고 안내한다', () => {
		expect(buildRecommendationAnswer({ targetDate: '2026-09-28', recommendations: [] })).toContain(
			'잠시 뒤 다시 시도해 주세요'
		);
	});
});

describe('buildFallbackPayload', () => {
	it('예보가 있으면 예보 요약으로, 없으면 일반 안내로 답한다', () => {
		const payload = buildFallbackPayload(rag);
		expect(payload.fallback).toBe(true);
		expect(payload.weatherCard.verdict).toBe('mixed');
		expect(payload.response).toContain('강원도 강릉시 / 2026-09-28 기준으로 봤어요.');
		expect(payload.response).toContain('21시: 관측 유리');

		expect(buildFallbackPayload(null)).toEqual({
			response: GENERIC_FALLBACK_ANSWER,
			weatherCard: null,
			fallback: true
		});
	});

	it('지역을 못 찾아 기본 지역을 썼으면 답변 첫머리에서 알린다', () => {
		const payload = buildFallbackPayload({ ...rag, locationMatched: false });
		expect(payload.response.startsWith('질문에서 지역을 정확히 찾지 못해서')).toBe(true);
	});
});

describe('buildUserPrompt', () => {
	it('예보를 찾은 질문에만 예보 근거를 붙인다', () => {
		expect(buildUserPrompt('안녕', null)).toBe("User's question: 안녕");

		const prompt = buildUserPrompt('내일 강릉 별 보여?', rag);
		expect(prompt).toContain('---DeepSky weather context---');
		expect(prompt).toContain('지역 기준: 사용자 질문에서 찾음');
		expect(prompt.endsWith("User's question: 내일 강릉 별 보여?")).toBe(true);
	});
});
