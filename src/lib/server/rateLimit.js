const DEFAULT_WINDOW_MS = 60 * 1000;
const MAX_BUCKETS = 10_000;

const rateLimitStore = globalThis.__deepSkyRateLimitStore ?? new Map();
if (process.env.NODE_ENV !== 'production') {
	globalThis.__deepSkyRateLimitStore = rateLimitStore;
}

let lastCleanupAt = 0;

export function getClientAddress(event) {
	try {
		return event.getClientAddress?.() || 'unknown';
	} catch {
		return 'unknown';
	}
}

function cleanupExpiredBuckets(now) {
	if (now - lastCleanupAt < DEFAULT_WINDOW_MS) return;

	lastCleanupAt = now;
	for (const [key, bucket] of rateLimitStore) {
		if (bucket.resetAt <= now) rateLimitStore.delete(key);
	}

	if (rateLimitStore.size <= MAX_BUCKETS) return;

	const overflow = rateLimitStore.size - MAX_BUCKETS;
	let deleted = 0;
	for (const key of rateLimitStore.keys()) {
		rateLimitStore.delete(key);
		deleted += 1;
		if (deleted >= overflow) break;
	}
}

export function checkRateLimit(scope, clientAddress, options = {}) {
	const limit = Math.max(1, Number(options.limit) || 60);
	const windowMs = Math.max(1000, Number(options.windowMs) || DEFAULT_WINDOW_MS);
	const now = Date.now();
	cleanupExpiredBuckets(now);

	const key = `${scope}:${clientAddress || 'unknown'}`;
	let bucket = rateLimitStore.get(key);
	if (!bucket || bucket.resetAt <= now) {
		bucket = { count: 0, resetAt: now + windowMs };
	}

	bucket.count += 1;
	rateLimitStore.set(key, bucket);

	const allowed = bucket.count <= limit;
	const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

	return {
		allowed,
		limit,
		remaining: Math.max(0, limit - bucket.count),
		retryAfterSeconds
	};
}

export function rateLimitHeaders(result) {
	return {
		'X-RateLimit-Limit': String(result.limit),
		'X-RateLimit-Remaining': String(result.remaining),
		...(result.allowed ? {} : { 'Retry-After': String(result.retryAfterSeconds) })
	};
}
