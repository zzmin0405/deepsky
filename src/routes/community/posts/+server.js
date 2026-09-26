import { publicPostSelect } from '$lib/server/postFields';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export async function GET() {
	try {
		const posts = await db.post.findMany({
			select: publicPostSelect,
			orderBy: { createdAt: 'desc' }
		});

		return json({ posts });
	} catch (error) {
		console.error('MySQL posts API error:', error.message);
		return json({ error: '게시글을 불러오지 못했습니다.' }, { status: 503 });
	}
}
