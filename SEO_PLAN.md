# SEO rollout and measurement

This file records the November 4, 2026 SEO rollout. It keeps the publishing scope, verified business facts, and measurement rules together so future changes can be compared with the saved baseline.

## Goal and scope

- Publish four distinct service landing pages, eight useful guides, and a crawlable blog index in the existing design.
- Repair relevant legacy redirects, correct misleading fee/distance wording, remove self-serving review schema, and replace the 7 MB hero download with responsive WebP assets.
- Generate canonical metadata, business/service/article/breadcrumb schema, internal links, sitemap and an RSS feed from one content catalog.
- Preserve the existing quote API, pricing logic, translations, and analytics destinations.
- Save the original rank snapshot, record rollout dates and URLs, and provide repeatable rank comparison and first-party measurement commands.

## Content contract

Use the installed `copywriting` skill and its AI-tells review. The four service intents are apartment moves, small moves, packing with a move, and small-office moves. Eight guides answer separate planning, pricing, access, packing, office and long-distance inventory questions. Keywords are research hypotheses, not invented volume or difficulty figures. Publish actual business facts and clearly labeled rate illustrations; never invent customer jobs, guarantees, licensing identifiers, or rankings.

Sources are the existing verified quote rules and current primary guidance from BHGS, FMCSA and LADOT where relevant. External legal definitions must not be confused with the application's internal 250-mile round-trip quote rule. Articles link to useful next steps and relevant service pages.

## Implementation and boundaries

- Markdown holds article bodies; a small `marked` build renders real HTML before deployment. Native Node scripts and Cheerio validate the published pages.
- Only public HTML, images, CSS, browser scripts, robots, sitemap and feed enter `dist/`. Private monitoring exports and content sources are not deployed.
- The root `api/` remains Vercel's existing function source; there are no CRM, messaging, routing or pricing changes.
- Ranking snapshots keep query, provider, location, language, device and examined depth. Missing ranks are never treated as position 51. Organic, brand-provider crosschecks and Maps remain separate.
- Ranking collection defaults to a price preview. Paid calls require an explicit live flag and budget; no paid background schedule is installed. First-party exports use the connected Treg tools.

## Failure checks

1. New pages must have unique visible H1/title/description/canonical and useful distinct content, accessible links and one quote path.
2. Published internal links and fragment targets resolve; sitemap contains each canonical once; every JSON-LD block parses.
3. No fabricated proof, boilerplate keyword variants, conflicting gas-fee claims, or unapproved customer actions.
4. Desktop/mobile screenshots preserve complete subjects and usable navigation; quote flow remains unchanged.
5. Build exports contain no credentials, tests, private snapshots or source content.
6. Rank comparison refuses different locations/devices/providers and never invents a numerical change from an unknown rank.
7. Production must serve the tested commit and pages; source parity alone is insufficient.

## Verification and status

Run `npm test`, `npm run build`, `npm run seo:validate`, and desktop/mobile browser checks. Deploy through the existing `main` Git connection, then verify public routes, redirects, generated files, assets and quote API availability without submitting a lead.

Status: implementation complete and locally verified on November 4, 2026. All 57 automated checks pass. Browser checks covered all 13 new routes at 320, 390 and 1440 pixels, with focused desktop/mobile screenshots of the index, article, service, homepage and quote form. A 320-pixel CTA overflow was corrected and rechecked. Production deployment `2e91b9e` succeeded; all 18 URLs, metadata, public assets, redirects and quote API availability were verified. Live desktop/mobile screenshots were inspected. Google accepted and fetched the sitemap with 18 submitted URLs, zero warnings and zero errors. Individual indexing and later ranking changes remain to be measured.

The audit baseline is `seo/baselines/2026-11-04-rankings.json`. Copywriting skill installed in the shared skills repository at upstream revision `88c79f6528a9`. The first live first-party export succeeded; Search Console returned empty reports and GA4 had no complete-day rows. Exports remain private; no paid rank calls or customer submissions were made for this release.

Remaining platform item: `www` still returns Vercel's domain-level 307 before the project-level permanent redirect. Both connected Vercel access and the existing CLI credential returned 403 for this team. The canonical apex site works; a permanent domain redirect needs team access. No recurring paid collection was enabled. The optional 28-query panel previews long-tail tracking costs; no extra paid calls were made.

Portfolio baseline: the original rank and technical evidence is now archived under `seo/evidence/2026-11-04-before/` with 28 SHA-256 hashes. `seo/baselines/2026-11-04-baseline.json` preserves pre-release figures and `seo/BASELINE.md` explains comparisons. The first release's measured technical results are in `seo/milestones/2026-11-04-release.json`. Fuel wording explicitly acknowledges the route-based gas fee in English, Spanish and Korean. Public copy no longer contains the old “No fuel surcharges” promise; the original claim remains only in the clearly labeled historical evidence archive.

November 4 expanded monitoring: Nikita approved a separate $0.28 cap for 28 keyword checks after the first release. The original baseline remains unchanged. Free Google redirect resolution enriches opaque result links; unknown domains stay flagged. Mocked tests verify that external destination pages are never fetched and failed lookups cannot establish absence.

Expanded snapshot completed: $0.276 billed within the separately approved $0.28 cap. There are 28 query rows: 27 complete provider responses and one partial response with 29 organic rows. All 1,327 examined organic publishers were identified and the site was not observed in them. The six zero-cost 40101 failures were inspected before a single retry each. A 40106 partial response was retained and billed at $0.006, not misreported as an uncharged failure. The unchanged original baseline, expanded post-release baseline, 34 raw SERP responses, 18 read-only indexing responses, charge ledger and evidence hashes are saved. Search Console reports five indexed, eleven discovered/not indexed and two unknown URLs. All 61 tests pass; no public UI or quote behavior changed in this monitoring extension.
