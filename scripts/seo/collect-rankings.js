// Previews the cost of repeating the fixed LA organic ranking panel.
// Paid calls require an explicit live flag and budget; partial runs retain their evidence.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { callTreg } from './treg.js';
import { parseOrganic } from './rankings.js';
const config = JSON.parse(readFileSync(new URL('../../seo/tracking-config.json', import.meta.url)));
const args = process.argv.slice(2);
const catalog = JSON.parse(readFileSync(new URL('../../content/pages.json', import.meta.url)));
const queries = args.includes('--include-long-tail') ? [...new Set([...config.queries, ...catalog.pages.flatMap(page => page.queries)])] : config.queries;
const estimate = queries.length * config.estimated_usd_per_query;
console.log(`${queries.length} queries; ${config.location}; ${config.language}; ${config.device}; depth ${config.requested_depth}. Estimated $${estimate.toFixed(2)} at the verified rate card. Brand and Maps are not part of this collector.`);
if (!args.includes('--live')) {
    console.log(`DRY RUN: no requests made. With fresh spending authorization, add --live --budget ${estimate.toFixed(2)}.`);
    console.log(queries.join('\n'));
} else {
    const budget = Number(args[args.indexOf('--budget') + 1]);
    if (!args.includes('--budget') || !Number.isFinite(budget) || budget < estimate) throw new Error(`Explicit budget must cover the $${estimate.toFixed(2)} plan.`);
    const run = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
    const directory = `seo/snapshots/${run}`;
    mkdirSync(directory, { recursive: true });
    const snapshot = { schema_version: 1, domain: config.domain, captured_date: new Date().toISOString().slice(0, 10), charged_usd: 0, rankings: [] };
    for (const [index, query] of queries.entries()) {
        if (snapshot.charged_usd + config.estimated_usd_per_query > budget + 1e-9) throw new Error('Remaining budget cannot cover the next request; partial snapshot retained.');
        const key = `splendid-seo-${run}-${index}`;
        const task = [{ keyword: query, location_code: config.location_code, language_code: config.language, device: config.device, depth: config.requested_depth }];
        const rawPath = `${directory}/raw-${index + 1}.json`;
        const response = callTreg([config.endpoint, '--method', 'POST', '--data', JSON.stringify(task), '-H', `Idempotency-Key: ${key}`, '-H', `X-Treg-Route-Max-Cost: ${config.estimated_usd_per_query}`], rawPath);
        const charge = response._treg?.charged_micro;
        if (!Number.isFinite(charge)) throw new Error('Charge unavailable; raw response retained. Stop and reconcile before further calls.');
        snapshot.charged_usd = Math.round(snapshot.charged_usd * 1e6 + charge) / 1e6;
        writeFileSync(`${directory}/rankings.json`, JSON.stringify(snapshot, null, 2));
        const settings = { query, domain: config.domain, provider: config.provider, location: config.location, language: config.language, device: config.device, requested_depth: config.requested_depth, evidence_file: rawPath };
        snapshot.rankings.push(parseOrganic(response, settings));
        writeFileSync(`${directory}/rankings.json`, JSON.stringify(snapshot, null, 2));
        console.log(`${query}: ${snapshot.rankings.at(-1).observed_rank ?? 'not found in examined rows'}; charged $${(charge / 1e6).toFixed(4)}`);
        if (snapshot.charged_usd > budget) throw new Error('Actual charge exceeded the estimate. Stopped; reconcile the provider rate before another run.');
    }
    console.log(`Saved ${directory}/rankings.json`);
}
