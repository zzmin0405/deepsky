import { PrismaClient } from '@prisma/client';
import { fail, redirect } from '@sveltejs/kit';

const prisma = new PrismaClient();

export const actions = {
  createPost: async ({ request }) => {
    const data = await request.formData();
    const title = data.get('title');
    const content = data.get('content');
    const author = data.get('author');
    const password = data.get('password');

    if (!title || !content || !author || !password) {
      return fail(400, { message: '모든 필드를 입력해 주세요.' });
    }

    await prisma.post.create({
      data: {
        title,
        content,
        author,
        password,
      },
    });

    throw redirect(302, '/community/posts');
  },
};