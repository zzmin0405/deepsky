import { PrismaClient } from '@prisma/client';
import { error, fail, redirect } from '@sveltejs/kit';

const prisma = new PrismaClient();

// SQL Injection 방지를 위한 입력값 검증 함수
function sanitizeInput(input) {
    if (!input) return '';
    // HTML 태그 제거
    input = input.replace(/<[^>]*>/g, '');
    // 특수문자 이스케이프
    input = input.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m];
    });
    return input;
}

// 입력값 길이 제한 검증
function validateInput(input, fieldName, maxLength) {
    if (input.length > maxLength) {
        throw new Error(`${fieldName}은(는) ${maxLength}자 이하여야 합니다.`);
    }
    return input;
}

export async function load({ params }) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: Number(params.id) },
    });

    if (!post) {
      throw error(404, '게시글을 찾을 수 없습니다.');
    }

    return { post };
  } catch (e) {
    console.error('Error loading post:', e);
    throw error(500, '게시글을 불러오는 중 오류가 발생했습니다.');
  }
}

export const actions = {
  updatePost: async ({ request, params }) => {
    try {
      const data = await request.formData();
      let title = data.get('title')?.trim();
      let content = data.get('content')?.trim();
      const password = data.get('password');

      if (!title || !content || !password) {
        return fail(400, { 
          message: '모든 필드를 입력해주세요.',
          values: { title, content }
        });
      }

      // 입력값 검증 및 이스케이프
      try {
        title = sanitizeInput(title);
        content = sanitizeInput(content);
        
        validateInput(title, '제목', 100);
        validateInput(content, '내용', 5000);
      } catch (validationError) {
        return fail(400, { 
          message: validationError.message,
          values: { title, content }
        });
      }

      const post = await prisma.post.findUnique({
        where: { id: Number(params.id) },
      });

      if (!post) {
        throw error(404, '게시글을 찾을 수 없습니다.');
      }

      if (post.password !== password) {
        return fail(400, { 
          message: '비밀번호가 일치하지 않습니다.',
          values: { title, content }
        });
      }

      await prisma.post.update({
        where: { id: Number(params.id) },
        data: {
          title,
          content,
          updatedAt: new Date(),
        },
      });

      return { 
        type: 'redirect',
        location: `/community/posts/${params.id}`,
        status: 303
      };
    } catch (e) {
      console.error('Error updating post:', e);
      return fail(500, { 
        message: '게시글 수정 중 오류가 발생했습니다.',
        values: { title, content }
      });
    }
  },
};