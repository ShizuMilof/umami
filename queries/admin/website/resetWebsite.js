import prisma from 'lib/prisma';

export async function resetWebsite(id) {
  const { client, transaction } = prisma;

  const website = await prisma.client.website.findUnique({
    id,
  });

  return transaction([
    client.pageview.deleteMany({
      where: { session: { website: { id } } },
    }),
    client.eventData.deleteMany({
      where: { event: { session: { website: { id } } } },
    }),
    client.event.deleteMany({
      where: { session: { website: { id } } },
    }),
    client.session.deleteMany({
      where: { website: { id } },
    }),
    client.website.update({
      where: {
        id,
      },
      revId: website.revId + 1,
    }),
  ]);
}
