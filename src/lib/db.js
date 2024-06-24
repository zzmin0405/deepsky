import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createPost(post) {
  return await prisma.post.create({ data: post });
}

export async function getPosts() {
  return await prisma.post.findMany();
}

export async function updatePost(id, post) {
  return await prisma.post.update({
    where: { id },
    data: post,
  });
}

export async function deletePost(id) {
  return await prisma.post.delete({ where: { id } });
}