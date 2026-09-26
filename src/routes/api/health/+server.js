import { json } from '@sveltejs/kit';

export function GET({ setHeaders }) {
	setHeaders({ 'cache-control': 'no-store' });

	return json({
		status: 'ok',
		service: 'deepsky',
		timestamp: new Date().toISOString()
	});
}
