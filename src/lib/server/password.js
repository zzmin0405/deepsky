import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password) {
	const salt = randomBytes(16).toString('hex');
	const derivedKey = await scrypt(password, salt, KEY_LENGTH);
	return `scrypt:${salt}:${Buffer.from(derivedKey).toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
	const [algorithm, salt, hash] = String(storedHash || '').split(':');
	if (algorithm !== 'scrypt' || !salt || !hash) return false;

	const storedKey = Buffer.from(hash, 'hex');
	if (storedKey.length !== KEY_LENGTH) return false;

	const derivedKey = Buffer.from(await scrypt(password, salt, KEY_LENGTH));
	return timingSafeEqual(storedKey, derivedKey);
}
