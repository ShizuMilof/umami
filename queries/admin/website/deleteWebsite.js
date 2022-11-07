import prisma from 'lib/prisma';
import redis, { DELETED } from 'lib/redis';

export async function deleteWebsite(id) {
  const { client, transaction } = prisma;

  return transaction([
    client.pageview.deleteMany({
      where: { websiteId: id },
    }),
    client.eventData.deleteMany({
      where: { event: { websiteId: id } },
    }),
    client.event.deleteMany({
      where: { websiteId: id },
    }),
    client.session.deleteMany({
      where: { websiteId: id },
    }),
    client.website.delete({
      where: { id },
    }),
  ]).then(async res => {
    if (redis.enabled) {
      await redis.set(`website:${id}`, DELETED);
    }

    return res;
  });
}
