import { PrismaClient } from '@prisma/client';
import { error, fail, redirect } from '@sveltejs/kit';

const prisma = new PrismaClient();

export async function load({ params }) {
  const post = await prisma.post.findUnique({
    where: { id: Number(params.id) },
  });

  if (!post) {
    throw error(404, 'Post not found');
  }

  return { post };
}

export const actions = {
  updatePost: async ({ request, params }) => {
    const data = await request.formData();
    const title = data.get('title');
    const content = data.get('content');
    const password = data.get('password');

    const post = await prisma.post.findUnique({
      where: { id: Number(params.id) },
    });

    if (!post) {
      throw error(404, 'Post not found');
    }

    if (post.password !== password) {
      return fail(400, { message: '비밀번호가 일치하지 않습니다.' });
    }

    await prisma.post.update({
      where: { id: Number(params.id) },
      data: {
        title,
        content,
      },
    });

    throw redirect(302, `community/posts/${params.id}`);
  },
};