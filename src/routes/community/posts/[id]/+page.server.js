import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';

export async function load({ params }) {
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', params.id)
    .single();

  if (fetchError) {
    throw error(404, '게시물을 찾을 수 없습니다.');
  }

  return { post };
}

export const actions = {
  deletePost: async ({ request, params }) => {
    const data = await request.formData();
    const password = data.get('password');

    const post = await supabase
      .from('posts')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!post) {
      throw error(404, 'Post not found');
    }

    if (post.password !== password) {
      return { message: '비밀번호가 일치하지 않습니다.' };
    }

    await supabase
      .from('posts')
      .delete()
      .eq('id', params.id);

    return { redirect: '/community/posts' };
  },

  deletePostByAdmin: async ({ params }) => {
    await supabase
      .from('posts')
      .delete()
      .eq('id', params.id);

    return { redirect: '/community/posts' };
  },
};