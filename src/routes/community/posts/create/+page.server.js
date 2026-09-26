import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hashPassword } from '$lib/server/password';
import { validatePostForm } from '$lib/server/postValidation';
import { checkRateLimit, getClientAddress } from '$lib/server/rateLimit';

export const actions = {
	createPost: async (event) => {
		const formData = await event.request.formData();
		const parsed = validatePostForm(formData);

		// 도배를 막기 위해 IP당 분당 작성 시도 횟수를 제한합니다.
		const rateLimit = checkRateLimit('post-create', getClientAddress(event), { limit: 5 });
		if (!rateLimit.allowed) {
			return fail(429, {
				message: '글 작성 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
				values: parsed.values
			});
		}

		if (parsed.error) {
			return fail(400, { message: parsed.error, values: parsed.values });
		}

		try {
			await db.post.create({
				data: {
					title: parsed.values.title,
					content: parsed.values.content,
					author: parsed.values.author,
					passwordHash: await hashPassword(parsed.password)
				}
			});
		} catch (error) {
			console.error('MySQL post create error:', error.message);
			return fail(503, {
				message: '데이터베이스 연결 문제로 게시글을 저장하지 못했습니다.',
				values: parsed.values
			});
		}

		throw redirect(303, '/community/posts');
	}
};
