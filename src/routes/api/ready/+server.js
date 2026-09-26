import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export async function GET({ setHeaders }) {
	setHeaders({ 'cache-control': 'no-store' });

	try {
		await db.$queryRaw`SELECT 1`;

		return json({
			status: 'ready',
			dependencies: { mysql: 'ok' },
			timestamp: new Date().toISOString()
		});
	} catch {
		return json(
			{
				status: 'not_ready',
				dependencies: { mysql: 'unavailable' },
				timestamp: new Date().toISOString()
			},
			{ status: 503 }
		);
	}
}
