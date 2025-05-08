import { fail, redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';

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

    const { error } = await supabase
      .from('posts')
      .insert([
        {
          title,
          content,
          author,
          password,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

    if (error) {
      return fail(500, { message: '게시물 생성 중 오류가 발생했습니다.' });
    }

    throw redirect(302, '/community/posts');
  }
};