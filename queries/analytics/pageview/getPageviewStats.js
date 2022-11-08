import prisma from 'lib/prisma';
import clickhouse from 'lib/clickhouse';
import { runQuery, CLICKHOUSE, PRISMA } from 'lib/db';
import { getWebsite } from 'queries';

export async function getPageviewStats(...args) {
  return runQuery({
    [PRISMA]: () => relationalQuery(...args),
    [CLICKHOUSE]: () => clickhouseQuery(...args),
  });
}

async function relationalQuery(
  websiteId,
  {
    start_at,
    end_at,
    timezone = 'utc',
    unit = 'day',
    count = '*',
    filters = {},
    sessionKey = 'session_id',
  },
) {
  const { getDateQuery, parseFilters, rawQuery } = prisma;
  const params = [start_at, end_at];
  const { pageviewQuery, sessionQuery, joinSession } = parseFilters(
    'pageview',
    null,
    filters,
    params,
  );

  return rawQuery(
    `select ${getDateQuery('pageview.created_at', unit, timezone)} t,
        count(${count !== '*' ? `${count}${sessionKey}` : count}) y
      from pageview
        join website
            on pageview.website_id = website.website_id
        ${joinSession}
      where website.website_id='${websiteId}'
        and pageview.created_at between $1 and $2
        ${pageviewQuery}
        ${sessionQuery}
      group by 1`,
    params,
  );
}

async function clickhouseQuery(
  websiteId,
  { start_at, end_at, timezone = 'UTC', unit = 'day', count = '*', filters = {} },
) {
  const { parseFilters, rawQuery, getDateStringQuery, getDateQuery, getBetweenDates } = clickhouse;
  const { revId } = await getWebsite({ id: websiteId }, true);
  const params = [websiteId, revId];
  const { pageviewQuery, sessionQuery } = parseFilters(null, filters, params);

  return rawQuery(
    `select
      ${getDateStringQuery('g.t', unit)} as t, 
      g.y as y
    from
      (select 
        ${getDateQuery('created_at', unit, timezone)} t,
        count(${count !== '*' ? 'distinct session_id' : count}) y
      from event
      where event_name = ''
        and website_id = $1        
        and rev_id = $2
        and ${getBetweenDates('created_at', start_at, end_at)}
        ${pageviewQuery}
        ${sessionQuery}
      group by t) g
    order by t`,
    params,
  );
}
