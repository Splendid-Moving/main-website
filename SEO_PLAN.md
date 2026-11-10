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

Visual follow-up, November 4: Nikita selected editorial illustrations. Eight original topic covers, responsive gallery thumbnails, split article headers, practical captions, mobile contents and three inline diagrams have been added. Article-specific schema/social images and image-sitemap entries point to the deployed WebP variants. The 1280×720 and 640×360 variants preserve complete compositions. Original source PNGs/prompts remain outside public output; original SEO snapshots are unchanged. Local link checks and 61 existing tests pass; responsive browser verification covers 45 route/viewport combinations. Production verification follows the Git release.

Visual release production verification completed for commit `250bf3d`: all eight articles and sixteen image files matched the tested build; eighteen sitemap URLs and eight image entries were present; Google accepted the sitemap with 204. Desktop/mobile screenshots were inspected and comparison screenshots saved in `design/blog-illustrations/review/`. No customer form was submitted, and original SEO evidence remains unchanged.

## Follow-up priorities, November 6

The homepage company summary was shortened and moved into the existing footer, with EN/ES/KO support and the `#about` legacy destination retained. The main content now flows directly from review proof to Services. This is a usability refinement, not a measured ranking gain; original baseline evidence remains unchanged.

The content/technical publishing phase is complete. Ranking improvement is unproven. The latest saved indexing/rank observations are from November 4, not a fresh November 6 measurement. Prioritize the following work rather than adding more pages immediately:

1. Recheck Search Console indexing for the four landing pages and eight guides. Investigate persistent exclusion and Google-selected canonicals. The saved November 4 inspection showed five indexed, eleven discovered/not indexed and two unknown URLs. Sitemap acceptance alone is insufficient.
2. Review the Google Business Profile's categories, services, hours and actual business/address eligibility; keep business information consistent across credible listings. Continue earning genuine customer reviews and relevant local links. No profile changes or customer messages are authorized by this website edit.
3. Add verified operational detail to priority pages as it becomes available: real job photos, actual building-access examples, and named staff review of practical advice. Editorial illustrations improve presentation but do not prove moving experience.
4. Investigate mobile loading and accessibility using the saved lab reports as a starting point (mobile performance 73, LCP 6.0 seconds, accessibility 89). Reproduce before choosing fixes. These are after-release starting measurements, not field Core Web Vitals or pre-release scores.
5. Add verified quote-success/click-to-call measurement in a separate scoped change, then distinguish clicks, accepted form submissions and booked moves. GA4 currently measures standard visits; it does not establish lead or booking improvements.
6. Resolve the outstanding Vercel domain-level `www` temporary redirect when the appropriate team access is available.

Measurement plan: November 11 is the first suggested matching weekly rank/indexing follow-up, subject to fresh approval for paid rank collection. Begin a complete 28-day post-launch traffic window on November 5 (through December 2), allowing for Search Console reporting delay. GA4 has no pre-install baseline, so its first complete period establishes a traffic baseline rather than a before/after improvement. Compare later equivalent periods, retain unchanged/worse results, and keep Maps separate from organic ranks. No automatic job, new Treg spend or ranking refresh was performed for this homepage edit.

## November 9 second round

The matching rank refresh found 14 entries into the examined results, with 27 successful keyword responses and one unavailable query. All 18 URLs are now indexed. Evidence remains in private `seo/snapshots/2026-11-09-follow-up/`; this is separate from the layout release below.

The second implementation round restructures every guide with practical visual components and improves the packing/small-move pages. It adds production-only saved-quote and phone-click events, using browser-local request deduplication without forwarding customer details. Fonts are served locally, the logo is reduced, and the Sentry loader is deferred. No quote API, rates, messaging or CRM behavior changes.

Local checks: 65 tests, all 18 pages’ links/metadata/schema, responsive guide and service-page review, and mocked browser verification of failed/successful quote measurement. All eight guides were reviewed at 320/390/768/1440px; the narrow rate-card overflow was corrected. Native contents links and checklists remain usable without a new client-side library.

Analytics configuration limitation: the connected Google token lacks the write scope needed for key events and custom dimensions. A key-event creation returned 403 and made no change. `generate_lead` will be recorded as an event; marking it as a key event and registering its custom report dimensions still require appropriate Google permission. No new paid Treg call or recurring collection was made for this implementation round.

Production verification and equivalent mobile Lighthouse results are recorded with the release evidence after the Git deployment. New ranking impact remains unmeasured for this round.
