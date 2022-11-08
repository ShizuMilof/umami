import prisma from 'lib/prisma';
import clickhouse from 'lib/clickhouse';
import { runQuery, PRISMA, CLICKHOUSE } from 'lib/db';
import { getWebsites } from 'queries';

export async function getSessions(...args) {
  return runQuery({
    [PRISMA]: () => relationalQuery(...args),
    [CLICKHOUSE]: () => clickhouseQuery(...args),
  });
}

async function relationalQuery(websites, start_at) {
  return prisma.client.session.findMany({
    where: {
      ...(websites && websites.length > 0
        ? {
            website: {
              id: {
                in: websites,
              },
            },
          }
        : {}),
      createdAt: {
        gte: start_at,
      },
    },
  });
}

async function clickhouseQuery(websiteIds, start_at) {
  const { rawQuery, getDateFormat, getWebsiteByRev } = clickhouse;

  const websites = await getWebsites(websiteIds, true);

  return rawQuery(
    `select distinct
      session_id,
      website_id,
      created_at,
      hostname,
      browser,
      os,
      device,
      screen,
      language,
      country
    from event
    where ${websites && websites.length > 0 ? `${getWebsiteByRev(websites)}` : '0 = 0'}
      and created_at >= ${getDateFormat(start_at)}`,
  );
}
