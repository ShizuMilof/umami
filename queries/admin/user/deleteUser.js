import prisma from 'lib/prisma';
import redis, { DELETED } from 'lib/redis';

export async function deleteUser(userId) {
  const { client } = prisma;

  const websites = await client.website.findMany({
    where: { userId },
  });

  let websiteIds = [];

  if (websites.length > 0) {
    websiteIds = websites.map(a => a.id);
  }

  return client
    .$transaction([
      client.pageview.deleteMany({
        where: { websiteId: { in: websiteIds } },
      }),
      client.eventData.deleteMany({
        where: { event: { websiteId: { in: websiteIds } } },
      }),
      client.event.deleteMany({
        where: { websiteId: { in: websiteIds } },
      }),
      client.session.deleteMany({
        where: { websiteId: { in: websiteIds } },
      }),
      client.website.deleteMany({
        where: { userId },
      }),
      client.user.delete({
        where: {
          id: userId,
        },
      }),
    ])
    .then(async res => {
      if (redis.enabled) {
        for (let i = 0; i < websiteIds.length; i++) {
          await redis.set(`website:${websiteIds[i]}`, DELETED);
        }
      }

      return res;
    });
}
