// Enriches a saved ranking snapshot using free Google redirect lookups.
// The source snapshot and raw paid responses remain untouched.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveOrganicDomains } from './resolve-domains.js';
const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: npm run seo:resolve -- INPUT.json OUTPUT.json');
if (resolve(input) === resolve(output)) throw new Error('Use a different output path to preserve the original snapshot.');
const snapshot = JSON.parse(readFileSync(input));
const enriched = { ...snapshot, source_snapshot: input, domain_resolution_at_utc: new Date().toISOString(), domain_resolution_paid_cost_usd: 0, rankings: [] };
for (const settings of snapshot.rankings) {
    const response = JSON.parse(readFileSync(settings.evidence_file));
    enriched.rankings.push(await resolveOrganicDomains(response, settings));
    writeFileSync(output, JSON.stringify(enriched, null, 2));
    const row = enriched.rankings.at(-1);
    console.log(`${row.query}: ${row.observed_rank ?? 'not found'}; ${row.organic_rows_examined} examined; ${row.unresolved_domains} unresolved`);
}
console.log(`Saved ${output}; no paid API calls were made.`);
