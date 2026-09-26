import { publicPostSelect } from '$lib/server/postFields';
import { db } from '$lib/server/db';

export async function load() {
	try {
		const posts = await db.post.findMany({
			select: publicPostSelect,
			orderBy: { createdAt: 'desc' }
		});

		return { posts };
	} catch (error) {
		console.error('MySQL posts read error:', error.message);
		return { posts: [], databaseUnavailable: true };
	}
}
