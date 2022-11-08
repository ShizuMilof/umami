import prisma from 'lib/prisma';
import redis from 'lib/redis';

export async function getWebsites(websites, allowRedis = false) {
  if (allowRedis && redis.enabled) {
    const keys = websites.map(a => `website:${a.id}`);

    const websites = await redis.mget(...keys);

    return websites;
  }

  return prisma.client.website.findMany({
    where: {
      id: {
        in: websites,
      },
    },
  });
}
