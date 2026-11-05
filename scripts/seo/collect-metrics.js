// Exports first-party Search Console and GA4 reports through the connected Treg tools.
// The default is a preview; exports remain private and outside the deployed site.
import { mkdirSync, writeFileSync } from 'node:fs';
import { callTreg } from './treg.js';
const args = process.argv.slice(2);
if (!args.includes('--live')) {
    console.log('DRY RUN: no requests. Use --live to export connected Search Console totals, queries and pages for two complete 28-day periods, plus GA4 traffic. No paid catalog endpoints are used.');
} else {
    const directory = `seo/snapshots/metrics-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    mkdirSync(directory, { recursive: true });
    const date = daysAgo => { const value = new Date(); value.setUTCDate(value.getUTCDate() - daysAgo); return value.toISOString().slice(0, 10); };
    const reports = [];
    for (const [period, start, end] of [['latest', 30, 3], ['previous', 58, 31]]) {
        for (const dimension of ['totals', 'query', 'page']) {
            const body = { startDate: date(start), endDate: date(end), dataState: 'final', rowLimit: 25000, ...(dimension === 'totals' ? {} : { dimensions: [dimension] }) };
            const response = callTreg(['google-search-console', 'webmasters/v3/sites/sc-domain%3Asplendidmoving.com/searchAnalytics/query', '--method', 'POST', '--data', JSON.stringify(body)], `${directory}/gsc-${period}-${dimension}.json`);
            const data = response.result ?? response;
            reports.push({ source: 'Search Console', period, dimension, request: body, status: data.rows?.length ? 'available' : 'unavailable: empty response; do not infer zero traffic', data });
        }
    }
    const body = { dateRanges: [{ startDate: '28daysAgo', endDate: 'yesterday' }, { startDate: '56daysAgo', endDate: '29daysAgo' }], dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'screenPageViews' }] };
    const response = callTreg(['google-analytics', 'v1beta/properties/433959940:runReport', '--method', 'POST', '--data', JSON.stringify(body)], `${directory}/ga4.json`);
    reports.push({ source: 'GA4', property: '433959940', note: 'Tag installed November 4, 2026; earlier periods are not a valid post-install comparison. QA visits may be included. Page views are not leads.', request: body, data: response.result ?? response });
    writeFileSync(`${directory}/metrics.json`, JSON.stringify({ captured_at: new Date().toISOString(), reports }, null, 2));
    console.log(`Saved ${directory}/metrics.json. Search Console query/page tables omit some data; use the separate totals report for totals.`);
}
