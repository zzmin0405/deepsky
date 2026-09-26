// 보안 회귀 테스트: 공개 조회의 비밀번호 해시 노출, 챗봇 입력 검증, LLM 장애 시 대체 응답,
// 비밀번호 대입 제한을 확인합니다. 실제 DB와 외부 API는 쓰지 않습니다.
import { describe, expect, it, vi } from 'vitest';

const { record } = vi.hoisted(() => ({
	record: {
		id: 1,
		title: '검증',
		content: '내용',
		author: '테스트',
		createdAt: new Date('2026-09-27T00:00:00Z'),
		updatedAt: new Date('2026-09-27T00:00:00Z'),
		passwordHash: '공개금지'
	}
}));

// select로 고른 필드만 돌려주는 가짜 Prisma 클라이언트입니다. select가 없으면 서버 내부 조회로 보고 전체를 줍니다.
vi.mock('$lib/server/db', () => {
	const pick = ({ select } = {}) =>
		select
			? Object.fromEntries(
					Object.keys(select)
						.filter((key) => select[key])
						.map((key) => [key, record[key]])
				)
			: { ...record };

	return {
		db: {
			post: {
				findMany: vi.fn(async (args) => [pick(args)]),
				findUnique: vi.fn(async (args) => pick(args)),
				delete: vi.fn(async () => record),
				update: vi.fn(async () => record)
			}
		}
	};
});

vi.mock('$env/dynamic/private', () => ({ env: { GEMINI_API_KEY: 'test-key' } }));

const publicLoads = {
	'커뮤니티 홈': () => import('../src/routes/community/+page.server.js'),
	'게시글 목록': () => import('../src/routes/community/posts/+page.server.js'),
	'게시글 상세': () => import('../src/routes/community/posts/[id]/+page.server.js'),
	'게시글 수정 화면': () => import('../src/routes/community/posts/[id]/edit/+page.server.js')
};

describe('게시판 공개 조회', () => {
	it.each(Object.entries(publicLoads))('%s는 비밀번호 해시를 내보내지 않는다', async (_, loadModule) => {
		const { load } = await loadModule();
		const data = await load({ params: { id: '1' } });
		expect(JSON.stringify(data)).not.toContain('공개금지');
	});

	it('게시글 JSON API도 비밀번호 해시를 내보내지 않는다', async () => {
		const { GET } = await import('../src/routes/community/posts/+server.js');
		expect(await (await GET()).text()).not.toContain('공개금지');
	});
});

describe('게시글 비밀번호 확인', () => {
	it('같은 IP에서 분당 10번을 넘게 시도하면 429로 막는다', async () => {
		const { actions } = await import('../src/routes/community/posts/[id]/+page.server.js');
		const attempt = () => {
			const body = new FormData();
			body.set('password', 'wrong-password');
			return actions.deletePost({
				request: new Request('http://localhost/community/posts/1?/deletePost', { method: 'POST', body }),
				params: { id: '1' },
				getClientAddress: () => 'password-attacker'
			});
		};

		for (let count = 0; count < 10; count += 1) {
			expect((await attempt()).status).toBe(400);
		}
		expect((await attempt()).status).toBe(429);
	});
});

describe('챗봇 API', () => {
	async function postChat(body, address = 'chat-test') {
		const { POST } = await import('../src/routes/api/chat/+server.js');
		return POST({
			request: new Request('http://localhost/api/chat', {
				method: 'POST',
				body,
				headers: { 'Content-Type': 'application/json' }
			}),
			getClientAddress: () => address
		});
	}

	it.each(['{', 'null', '{}', '{"message":12}', JSON.stringify({ message: 'x'.repeat(2001) })])(
		'잘못된 요청 %s는 400으로 거절한다',
		async (body) => {
			expect((await postChat(body)).status).toBe(400);
		}
	);

	it('LLM 호출이 네트워크 오류로 실패해도 대체 응답을 돌려준다', async () => {
		vi.stubGlobal('fetch', async () => {
			throw new Error('테스트 네트워크 실패');
		});
		vi.spyOn(console, 'error').mockImplementation(() => {});

		const response = await postChat(JSON.stringify({ message: '안녕하세요' }));

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ fallback: true, response: expect.any(String) });
	});

	it('같은 IP에서 분당 20번을 넘게 질문하면 429로 막는다', async () => {
		for (let count = 0; count < 20; count += 1) {
			await postChat('{', 'chat-burst');
		}
		expect((await postChat('{', 'chat-burst')).status).toBe(429);
	});
});
