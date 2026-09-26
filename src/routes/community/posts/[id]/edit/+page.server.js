import { publicPostSelect } from '$lib/server/postFields';
import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { verifyPassword } from '$lib/server/password';
import { parsePostId, validatePostForm } from '$lib/server/postValidation';
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
		throw error(404, '게시글을 찾을 수 없습니다.');
	}

	return { post };
}

export const actions = {
	updatePost: async (event) => {
		const { request, params } = event;
		const id = requirePostId(params.id);
		const formData = await request.formData();
		const parsed = validatePostForm(formData, { requireAuthor: false });

		// 삭제와 같은 한도를 공유해 비밀번호 대입을 막습니다.
		const rateLimit = checkRateLimit('post-password', getClientAddress(event), { limit: 10 });
		if (!rateLimit.allowed) {
			return fail(429, {
				message: '비밀번호 확인 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
				values: parsed.values
			});
		}

		if (parsed.error) {
			return fail(400, { message: parsed.error, values: parsed.values });
		}

		const post = await db.post.findUnique({ where: { id } });
		if (!post) throw error(404, '게시글을 찾을 수 없습니다.');

		if (!(await verifyPassword(parsed.password, post.passwordHash))) {
			return fail(400, {
				message: '비밀번호가 일치하지 않습니다.',
				values: parsed.values
			});
		}

		await db.post.update({
			where: { id },
			data: {
				title: parsed.values.title,
				content: parsed.values.content
			}
		});

		throw redirect(303, `/community/posts/${id}`);
	}
};
