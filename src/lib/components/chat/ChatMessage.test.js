import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ChatMessage from './ChatMessage.svelte';

const weatherCard = {
	location: '강원도 강릉시',
	targetDate: '2026-09-28',
	verdict: 'good',
	summary: '조회한 시간대 전부 관측에 비교적 유리합니다. 추천 시간대: 21시',
	matched: false,
	recommendedTimes: ['2100'],
	rows: [
		{
			time: '2100',
			observable: true,
			sky: '맑음',
			precipitation: '없음',
			precipitationProbability: 0,
			humidity: 70
		}
	]
};

describe('ChatMessage', () => {
	it('봇 답변 속 HTML은 서버 렌더링에서 실행되지 않도록 글자 그대로 내보낸다', () => {
		const { body } = render(ChatMessage, {
			props: { message: { text: '<script>alert(1)</script>', isUser: false } }
		});
		expect(body).not.toContain('<script>alert(1)</script>');
		expect(body).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
	});

	it('예보 카드가 있으면 판정 배지와 추천 시간을 함께 보여준다', () => {
		const { body } = render(ChatMessage, {
			props: { message: { text: '좋아요', isUser: false, weatherCard } }
		});
		expect(body).toContain('관측 유리');
		expect(body).toContain('21시');
		expect(body).toContain('지역명을 정확히 찾지 못해');
	});

	it('답변을 기다리는 동안에는 상태 표시를 보여준다', () => {
		const { body } = render(ChatMessage, { props: { pending: true } });
		expect(body).toContain('답변을 준비하고 있어요');
	});
});
