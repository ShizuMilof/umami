import prisma from 'lib/prisma';
import redis from 'lib/redis';

export async function createWebsite(userId, data) {
  return prisma.client.website
    .create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        ...data,
        revId: 0,
      },
    })
    .then(async data => {
      if (redis.enabled && data) {
        await redis.set(`website:${data.id}`, data);
      }

      return data;
    });
}
