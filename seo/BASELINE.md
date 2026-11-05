# Splendid Moving: SEO before and after

This record separates the original November 4, 2026 audit from the first website release that followed it. Preserve the original evidence and save later measurements in new dated files so portfolio claims can be checked.

## Original search baseline

The site before the SEO release was commit `b509ed24fba11244acb9941da3b88e1b660e214a`. The original observations were collected before release `2e91b9e`; creating this archive later does not turn today's new pages into pre-existing content.

| Query | Observed website rank | Organic results examined |
| --- | --- | ---: |
| splendid moving | 1, Cloro; DataForSEO disagreed | 8 |
| local movers los angeles | Not found in the examined results | 48 |
| movers los angeles | Not found in the examined results | 49 |
| long distance movers los angeles | Not found in the examined results | 50 |
| commercial movers los angeles | Not found in the examined results | 49 |
| office movers los angeles | Not found in the examined results | 49 |
| packing services los angeles | Not found in the examined results | 49 |

Settings: Los Angeles city, English, desktop; DataForSEO location 1013962 and requested depth 50 for service searches. Cloro's branded check used the saved Los Angeles UULE. A missing rank has no numerical value and must never be changed into position 51. Keep the brand-provider disagreement visible.

Google Local Finder separately placed Splendid **13th of 20 non-sponsored businesses** for “movers los angeles.” The raw position was 16 including three sponsored listings. That sample displayed **4.9 stars and 509 reviews** and matched the business phone and Google CID. It is one city-origin sample, not a neighborhood grid or an organic website rank.

Moz's provider snapshot, last crawled **October 6, 2026**, reported **76 referring root domains**, **163 external linking pages for the whole domain**, and **142 external linking pages for the homepage**. Its proprietary scores were **Domain Authority 6**, **homepage Page Authority 28**, and raw **spam score 5**. These are vendor observations, not Google scores or exhaustive live totals. Four stored keyword database rows were dated September and are not today's complete keyword count.

## Technical work already measured

| Metric | Before audit | First release, November 4 |
| --- | ---: | ---: |
| Canonical pages returning 200 | 5 | 18 |
| Sitemap URLs | 5 | 18 |
| Articles | 0 | 8 |
| Focused service landing pages added | 0 | 4 |
| Blog indexes | 0 | 1 |
| Checked legacy URLs ending in 404 | 4 | 0 |
| Desktop hero image | 7,063,710 bytes | 215,338 bytes, 96.95% smaller |
| Mobile hero image | Same 7,063,710-byte PNG | 80,988 bytes, 98.85% smaller |
| Self-serving review scores in business schema | Present | Removed |
| Preferred-host redirect | 307 | 307, platform access needed |

Google accepted the new sitemap and fetched its 18 submitted URLs with zero warnings/errors. That is sitemap processing evidence, not proof that every new page is indexed. The four retired URLs now use permanent redirects to relevant replacements. Responsive screenshots and the public quote API were checked; no customer request was submitted.

These figures establish implementation improvements. They do not establish better rankings, faster field Core Web Vitals, more traffic, leads or revenue.

## Figures we cannot honestly fill in yet

- Search Console clicks, impressions, CTR and average position: successful requests returned no rows. Status is **unavailable**, not zero. Homepage URL Inspection separately confirmed “Submitted and indexed,” a matching canonical and a last Google crawl at `2026-11-04T08:26:38Z`.
- GA4 organic sessions before the work: unavailable. The production tag began November 4, 2026, so an earlier period is not a fair comparison. QA visits may be included.
- Quote conversions and booked moves attributed to organic traffic: no verified measurement baseline yet. Page views are not leads.
- Pre-release Lighthouse scores and field Core Web Vitals: not captured. Any performance audit run now is explicitly a **post-release starting measurement**.
- The new pages' long-tail ranks: not measured before publication. Their first fresh panel must be labeled an initial measurement.

## Evidence and future comparisons

- Full structured baseline: [2026-11-04-baseline.json](baselines/2026-11-04-baseline.json).
- Original query positions/settings/timestamps: [2026-11-04-rankings.json](baselines/2026-11-04-rankings.json).
- Unchanged raw public responses, original page HTML and file hashes: [evidence manifest](evidence/2026-11-04-before/manifest.json). The archive contains 28 source files and stays outside deployed output.
- First-release measurements: [2026-11-04-release.json](milestones/2026-11-04-release.json).
- Target phrases and publication catalog: [pages.json](../content/pages.json).

Preview the original six-query panel with `npm run seo:ranks`. Preview the broader 28-query panel with `npm run seo:ranks -- --include-long-tail`. Paid collection requires fresh spending authorization, `--live` and a sufficient explicit `--budget`; no recurring paid job is installed. Snapshot files retain raw responses, exact search settings, examined row counts and unresolved result domains.

Compare saved runs with `npm run seo:compare -- --baseline seo/baselines/2026-11-04-rankings.json --current seo/snapshots/RUN/rankings.json`. A newly tracked query gets “new measurement,” not an invented prior rank. Use the first broader snapshot as the baseline for its additional queries in subsequent comparisons. Keep organic, branded and Maps results separate.

Suggested cadence: weekly ranking panels and equivalent complete 28-day Search Console/GA4 windows once data exists. Use `npm run seo:metrics -- --live` for first-party reports through the existing connected Treg tools; exports remain private. Keep search totals separate from query tables, which can omit rows.

A defensible portfolio result might later say “entered the examined top 50 for X” or “moved from measured position 28 to 19,” with dates and unchanged settings. Traffic and lead claims need their own verified sources and comparable periods. Retain setbacks and unchanged metrics alongside improvements.

## First performance measurement, after the initial release

These live homepage runs used Lighthouse **13.6.0** after release `2e91b9e`. They are the starting measurements for future performance work, not before-and-after gains from today's image change.

| Lab metric | Mobile | Desktop |
| --- | ---: | ---: |
| Performance score | 73 | 97 |
| Accessibility score | 89 | 89 |
| Best practices score | 100 | 100 |
| SEO checks score | 100 | 100 |
| First Contentful Paint | 1.9 s | 0.8 s |
| Largest Contentful Paint | 6.0 s | 1.1 s |
| Total Blocking Time | 80 ms | 0 ms |
| Cumulative Layout Shift | 0 | 0.011 |
| Speed Index | 5.1 s | 1.0 s |

Lighthouse's SEO category checks technical basics; 100 does not mean a page ranks well. These are single lab runs using Lighthouse's mobile and desktop presets, not real-user field Core Web Vitals. Read the raw values, exact timestamps, environment and full settings in [performance-start.json](milestones/2026-11-04-performance-start.json). Neither run reported a runtime error or warning.

Open the [mobile report](evidence/2026-11-04-after/lighthouse-current-mobile.report.html) or [desktop report](evidence/2026-11-04-after/lighthouse-current-desktop.report.html) locally for Google's complete audit output. Repeat with the same Lighthouse version, presets and URL; investigate variation rather than presenting a single changed score as certainty. The [official Lighthouse CLI documentation](https://github.com/GoogleChrome/lighthouse#using-the-node-cli) describes the tool.

```sh
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npx --yes lighthouse@13.6.0 https://splendidmoving.com/ --only-categories=performance,accessibility,best-practices,seo --output=json --output=html --output-path=output/playwright/lighthouse-next-mobile --chrome-flags='--headless' --quiet
# Repeat with --preset=desktop and a different output path for desktop.
```

## Expanded snapshot now captured

Nikita approved a separate $0.28 budget for the broader panel. The [November 4 expanded snapshot](2026-11-04-expanded-snapshot.md) records all 28 target queries after the first release. It examined 1,327 organic rows with no unresolved publisher domains. The site was absent from the examined rows; 27 provider responses were complete and one was partial (29 rows). This does not establish an exact rank below 50 or a ranking change from before publication.

Actual cost was **$0.276**. The original baseline and its evidence were preserved unchanged. The [expanded JSON baseline](baselines/2026-11-04-expanded-post-release.json) is ready for later matching comparisons; keep its one partial query flagged until a complete measurement exists. Read-only [indexation checks](milestones/2026-11-04-indexing-start.json) additionally recorded five indexed URLs, eleven discovered/not indexed and two unknown to Google. No recurring paid job was installed.
