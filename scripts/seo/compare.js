// Produces a readable ranking comparison from two saved snapshots.
// This command reads files only and never calls a paid service.
import { readFileSync, writeFileSync } from 'node:fs';
import { compareRankings } from './rankings.js';
const args = process.argv.slice(2);
const value = flag => args[args.indexOf(flag) + 1];
if (!args.includes('--baseline') || !args.includes('--current')) {
    console.log('Usage: npm run seo:compare -- --baseline seo/baselines/2026-11-04-rankings.json --current seo/snapshots/RUN/rankings.json [--output report.md]');
} else {
    const before = JSON.parse(readFileSync(value('--baseline')));
    const after = JSON.parse(readFileSync(value('--current')));
    const rows = compareRankings(before.rankings, after.rankings);
    const display = rank => rank ?? 'Not found / not measured';
    const report = `# Splendid Moving ranking comparison\n\n${before.captured_date} → ${after.captured_date}\n\n| Query | Before | After | Change | Result |\n| --- | --- | --- | --- | --- |\n${rows.map(row => `| ${row.query} | ${display(row.before)} | ${display(row.after)} | ${row.change == null ? '—' : row.change > 0 ? '+' + row.change : row.change} | ${row.status} |`).join('\n')}\n\nMissing ranks have no numerical position. Read each snapshot's examined-row count and unresolved domains. Brand crosschecks and Maps are separate measurements.\n`;
    if (args.includes('--output')) writeFileSync(value('--output'), report);
    console.log(report);
}
