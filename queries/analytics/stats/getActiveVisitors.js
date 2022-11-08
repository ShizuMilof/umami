import { subMinutes } from 'date-fns';
import prisma from 'lib/prisma';
import clickhouse from 'lib/clickhouse';
import { runQuery, CLICKHOUSE, PRISMA } from 'lib/db';
import { getWebsite } from 'queries';

export async function getActiveVisitors(...args) {
  return runQuery({
    [PRISMA]: () => relationalQuery(...args),
    [CLICKHOUSE]: () => clickhouseQuery(...args),
  });
}

async function relationalQuery(websiteId) {
  const date = subMinutes(new Date(), 5);
  const params = [date];

  return prisma.rawQuery(
    `select count(distinct session_id) x
    from pageview
      join website 
        on pageview.website_id = website.website_id
    where website.website_id = '${websiteId}'
    and pageview.created_at >= $1`,
    params,
  );
}

async function clickhouseQuery(websiteId) {
  const { rawQuery, getDateFormat } = clickhouse;
  const { revId } = await getWebsite({ id: websiteId }, true);
  const params = [websiteId, revId];

  return rawQuery(
    `select count(distinct session_id) x
    from event
    where website_id = $1
      and rev_id = $2
      and created_at >= ${getDateFormat(subMinutes(new Date(), 5))}`,
    params,
  );
}
