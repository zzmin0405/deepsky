import { PrismaClient } from '@prisma/client';

const prismaGlobal = globalThis;

export const db = prismaGlobal.__deepSkyPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
	prismaGlobal.__deepSkyPrisma = db;
}
