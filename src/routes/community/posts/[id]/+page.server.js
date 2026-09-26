import { publicPostSelect } from '$lib/server/postFields';
import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { verifyPassword } from '$lib/server/password';
import { parsePostId } from '$lib/server/postValidation';
import { checkRateLimit, getClientAddress } from '$lib/server/rateLimit';

function requirePostId(value) {
	const id = parsePostId(value);
	if (!id) throw error(400, '올바르지 않은 게시글 번호입니다.');
	return id;
}

export async function load({ params }) {
	const id = requirePostId(params.id);
	const post = await db.post.findUnique({ where: { id }, select: publicPostSelect });

	if (!post) {
		throw error(404, '게시물을 찾을 수 없습니다.');
	}

	return { post };
}

export const actions = {
	deletePost: async (event) => {
		const { request, params } = event;
		const id = requirePostId(params.id);

		// 비밀번호 대입을 막기 위해 수정·삭제 시도를 IP당 분당 횟수로 제한합니다.
		const rateLimit = checkRateLimit('post-password', getClientAddress(event), { limit: 10 });
		if (!rateLimit.allowed) {
			return fail(429, { message: '비밀번호 확인 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' });
		}

		const formData = await request.formData();
		const password = String(formData.get('password') || '');
		const post = await db.post.findUnique({ where: { id } });

		if (!post) {
			throw error(404, '게시물을 찾을 수 없습니다.');
		}

		if (!(await verifyPassword(password, post.passwordHash))) {
			return fail(400, { message: '비밀번호가 일치하지 않습니다.' });
		}

		await db.post.delete({ where: { id } });
		throw redirect(303, '/community/posts');
	}
};
