import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function load() {
  const recentPosts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return { recentPosts };
}