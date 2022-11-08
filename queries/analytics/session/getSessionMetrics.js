import prisma from 'lib/prisma';
import clickhouse from 'lib/clickhouse';
import { runQuery, CLICKHOUSE, PRISMA } from 'lib/db';
import { getWebsite } from 'queries';

export async function getSessionMetrics(...args) {
  return runQuery({
    [PRISMA]: () => relationalQuery(...args),
    [CLICKHOUSE]: () => clickhouseQuery(...args),
  });
}

async function relationalQuery(websiteId, { startDate, endDate, field, filters = {} }) {
  const { parseFilters, rawQuery } = prisma;
  const params = [startDate, endDate];
  const { pageviewQuery, sessionQuery, joinSession } = parseFilters(null, filters, params);

  return rawQuery(
    `select ${field} x, count(*) y
    from session as x
    where x.session_id in (
      select pageview.session_id
      from pageview
        join website 
          on pageview.website_id = website.website_id
        ${joinSession}
      where website.website_id='${websiteId}'
      and pageview.created_at between $1 and $2
      ${pageviewQuery}
      ${sessionQuery}
    )
    group by 1
    order by 2 desc`,
    params,
  );
}

async function clickhouseQuery(websiteId, { startDate, endDate, field, filters = {} }) {
  const { parseFilters, getBetweenDates, rawQuery } = clickhouse;
  const { revId } = await getWebsite({ id: websiteId }, true);
  const params = [websiteId, revId];
  const { pageviewQuery, sessionQuery } = parseFilters(null, filters, params);

  return rawQuery(
    `select ${field} x, count(*) y
    from event as x
    where website_id = $1
      and rev_id = $2
      and event_name = ''
      and ${getBetweenDates('created_at', startDate, endDate)}
      ${pageviewQuery}
      ${sessionQuery}
    group by x
    order by y desc`,
    params,
  );
}
