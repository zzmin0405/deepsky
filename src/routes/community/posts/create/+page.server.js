import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hashPassword } from '$lib/server/password';
import { validatePostForm } from '$lib/server/postValidation';

export const actions = {
	createPost: async ({ request }) => {
		const formData = await request.formData();
		const parsed = validatePostForm(formData);

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
