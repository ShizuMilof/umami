import prisma from 'lib/prisma';
import redis from 'lib/redis';

export async function getWebsite(where, allowRedis = false) {
  const { id } = where;

  if (allowRedis && redis.enabled && id) {
    const website = await redis.get(`website:${id}`);

    return website;
  }

  return prisma.client.website
    .findUnique({
      where,
    })
    .then(async data => {
      if (redis.enabled && data) {
        await redis.set(`website:${data.id}`, data);
      }

      return data;
    });
}
