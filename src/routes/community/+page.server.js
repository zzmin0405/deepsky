import { publicPostSelect } from '$lib/server/postFields';
import { db } from '$lib/server/db';

export async function load() {
	try {
		const recentPosts = await db.post.findMany({
			select: publicPostSelect,
			orderBy: { createdAt: 'desc' },
			take: 5
		});

		return { recentPosts };
	} catch (error) {
		console.error('MySQL recent posts read error:', error.message);
		return { recentPosts: [], databaseUnavailable: true };
	}
}
