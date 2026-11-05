# Splendid Moving website

This is Splendid Moving's public website and its shareable `/quote` form. The form saves requests in GoHighLevel, calculates round-trip driving mileage, and can send the agreed local quote by SMS when automatic sending is enabled.

## Customer flow

The homepage and all three service pages link to `https://splendidmoving.com/quote`. Vercel's existing clean-URL setting serves `quote.html` at that path.

The centered form shows one step at a time, with Back/Continue controls, saved answers, and smooth directional transitions. Its first step asks for full pickup and drop-off addresses using the original Google Places dropdowns. Customers can enter a full address manually if suggestions fail. There is no ZIP-only step and no repeated address collection.

- Studio / 1 bedroom: 2 movers, $115 cash / $125 card hourly.
- 2 bedrooms: 3 movers, $145 / $155.
- 3 or 4+ bedrooms: 4 movers, $180 / $190.
- All hourly quotes have a three-hour minimum.
- Offices receive manual quotes.
- Round trip **over 250 miles**: collect photos or an item list for manual flat pricing; never send the hourly quote. Photos are recommended for accuracy, with email offered as an alternative.
- Mileage lookup fails: send the hourly quote without the entire gas-fee line, and create a CRM review note/task.

English, Spanish, and Korean are supported. Reduced-motion preferences skip the swipe animation.

## Gas and CRM behavior

The driving circuit is `90015, Los Angeles → pickup → drop-off → 90015, Los Angeles`. Distances come from Google Routes; all three legs are summed before converting to miles. The >250-mile cutoff uses the unrounded total. Local totals are rounded once before applying these tiers:

| Rounded miles | Fee |
| --- | --- |
| 0–35 | $30 |
| 36–55 | $50 |
| 56–75 | $60 |
| 76–120 | $70 |
| 121–170 | $80 |
| 171–250 | $100 |

The numerical GHL **Gas Fee** field is `2nEnIoqxsJhlJQx74RJm` (`contact.gas_fee`). Local prices write a number; manual/unavailable prices clear an old value. This was verified by writing $30 and restoring the prior empty value on the authorized test contact. Booking, calendar, deposit, and job-note trigger fields are untouched.

Returning contacts are updated without `locationId` or replacement tags; tags are added separately. Global/channel SMS restrictions are respected. A successful contact save remains successful when messaging fails, with a separate quote status and manual follow-up. An accepted message is not proof of delivery.

Each form submission has its own request ID. Its SMS status and message ID are recorded in the existing GoHighLevel contact notes. Retrying that same request reuses its result; a fresh submission always updates the contact and can send a new quote, even when the details are identical. There is no customer-wide cooldown and no Redis database.

Concurrent calls within one server process share a pending request. GoHighLevel notes preserve completed/uncertain outcomes across restarts. Notes are not a distributed transaction lock: requests racing on separate server instances can still overlap. Uncertain sends are held for manual review rather than blindly retried. Mileage caching and basic IP limits are temporary per-process caches, so they do not block sending when a database is absent.

## Setup before live activation

Copy the names from `.env.example` into the correct Vercel project's environment settings. Keep all real credentials out of git and never paste them into documentation.

1. Existing CRM settings: `GHL_ACCESS_TOKEN`, `GHL_LOCATION_ID`. Contacts are looked up by normalized phone first; an existing record is updated, preserving tags and omitting `locationId` from the update. New records are created only when no matching phone exists. A blank new move date clears an old date.
2. `GOOGLE_MAPS_API_KEY`: the working website key is configured in encrypted production/preview settings and ignored local `.env`. A direct full-circuit request returned 29 miles / $30. Mileage needs no database.
3. `AUTO_QUOTES_ENABLED=true` activates the automatic GHL SMS quote. The production activation is authorized by Nikita. DND remains respected. Accepted quotes create a CRM follow-up note/task as well as retaining the existing `website-lead` tag.
4. `GHL_QUOTE_ASSIGNEE_ID` routes review tasks to the existing operations user. Missing/failed mileage still sends the hourly quote without its entire gas line and creates a manual-gas task.
5. `RESEND_API_KEY`, `RESEND_FROM`, and `LONG_DISTANCE_QUOTE_TO=info@splendidmoving.com` enable the long-distance office email. The existing Splendid sender is `reports@mail.splendidmoving.com`. The email follows the support-agent/fleet-report style, includes the full move details, sets Reply-To to the customer, and attaches the inventory photos. Resend idempotency keys and GHL receipts distinguish retries from fresh requests.

## Photo attachments and mobile layout

Customers attach photos **inside the quote form**; there is no separate-email workaround. The photo step supports previews, removing images, adding more, and EN/ES/KO copy. Up to ten originals at 15 MB each are accepted. The browser prepares clear JPEG copies up to 1600px, within a 2 MiB total byte budget, so a single request fits Vercel’s 4.5 MB cap. JPEG, PNG, WebP and HEIC/HEIF are supported. Ordinary files use native browser imaging; HEIC conversion loads the separately licensed decoder only when needed.

Photos stay in browser memory until the final request, then become private Resend attachments to the office. The server checks count, total size, base64 and actual image signatures. No database, file-storage account, public URLs, or staff gallery are required. A failed email leaves the form and attachments ready to retry with the same ID. Reloading restores text answers and asks for photos to be reattached rather than pretending browser files survived.

Native date fields and other controls are constrained to the card’s width. All 11 steps passed 132 layout checks across Chrome and WebKit at 320/360/390/430/768/1440px. Date screenshots were visually reviewed in WebKit iPhone emulation; a physical device remains a separate check.

## Run and verify

### Website analytics

All 18 public pages load `scripts/analytics.js`, which connects production visits to Google Analytics property `433959940`, web stream `7782345323` (`G-SRG0H6LFG5`). This is the existing `splendidmoving.com` property accessible through Treg. Vercel Analytics remains enabled alongside Google Analytics.

The shared tag runs only on `splendidmoving.com` and `www.splendidmoving.com`; localhost and Vercel preview domains do not send Google Analytics events. Google handles standard page-view measurement. This setup does not add custom quote-submission or completed-call conversion events.

To verify a deployment, open a production page and check that the Google tag loads and a `g/collect` request includes `tid=G-SRG0H6LFG5`. Treg can confirm recent events with `google-analytics/v1beta/properties/433959940:runRealtimeReport`. Standard reports take longer to process than realtime reports.

### Development checks

- Install: `npm ci`.
- App/API development: `npm run dev` using the Vercel CLI and the intended project/environment.
- Static-only preview: `npm run build && npm start`, then open `http://127.0.0.1:8000`. The preview supports clean URLs but does not run API functions.
- Automated checks: `npm test` — quote behavior, static SEO output and ranking comparison; mocked network, no real messages.
- Build and link checks: `npm run build && npm run seo:validate`. The build writes only public files to `dist/`; Vercel retains root `api/` functions.

**Every test uses only phone `8185054576`.** Nikita deleted the previous test contact. The authorized new test contact is **Quote Form Test**, ID `7QEmujHBzyoV5LNCtfxw`. A real new-contact test delivered the three-mover quote with a $30 gas fee. Retrying the same request reused the original message ID with no second send. The live returning request updated that same contact to 4+ bedrooms and a flexible date, stored $30 gas, and delivered the four-mover quote. A production retry reused the same message ID. Exactly two quote messages exist for the two genuine requests; long-distance inventory submission created an assigned manual-pricing task with no hourly SMS.

Automated checks cover rates/rounding, long-distance/manual cases, Google outages, no-Redis routing/SMS, existing-contact updates, fresh repeat requests, same-request retries, uncertain sends, and CRM-note receipts. Current browser checks include photo previews/add/remove, HEIC conversion, language changes, a failed-send retry preserving the exact photo payload, and ten-photo payload sizing. The production mobile WebKit form submitted a JPEG and an iPhone HEIC photo; Resend accepted both attachments to `info@splendidmoving.com` and the GHL receipt recorded the email ID. Replaying that submission returned the same email ID without sending again. The contact still has exactly the original two hourly quote texts, both delivered; neither long-distance photo test sent an hourly SMS. Inbox delivery was not independently checked. Production date/photo screenshots were visually reviewed, including the date field at 320px.

## Files

- `quote.html`, `styles/quote-page.css` — centered standalone form shell and design.
- `scripts/quote-form.js`, `quote-copy.js`, `quote-places.js`, `quote-photos.js` — steps, languages, full-address selection, and photo preparation.
- `lib/quote/` — pricing, routing, GHL receipts/contact updates, image validation, and Resend office emails.
- `api/submit-quote.js`, `quote-route.js` — final intake and address-based route check.
- `assets/vendor/` — separately loaded HEIC decoder, license, and source reference.
- `tests/` — meaningful business-rule and CRM contract checks.
- `SPEC.md` — agreed behavior, limits, and current status.

## SEO content and monitoring

The November 4, 2026 release adds four service pages (apartments, small moves, packing with a move, and small offices), eight planning guides, and `/blog`. Edit metadata and related links in `content/pages.json`; edit bodies in `content/landing/` and `content/blog/`. Run the build to generate real HTML, an 18-URL sitemap and the eight-article RSS feed. Generated output is ignored by Git. `dist/sitemap.xml` and `dist/robots.txt` are generated; there are no separate root copies to maintain. Existing pages remain root HTML sources, with common metadata/schema and discovery links applied during the build.

`SEO_PLAN.md` records scope and checks; `.agents/product-marketing.md` records supported claims and voice. New copy uses the shared `copywriting` skill. Keywords in the catalog are targeting hypotheses; search volume and ranking gains have not been invented. New content is in English, with English guides identified in translated navigation.

The build removes self-serving aggregate review markup, adds MovingCompany/Service/BlogPosting/BreadcrumbList data, and creates relevant permanent redirects for four retired URLs. It serves responsive WebP hero images (about 210 KiB desktop and 79 KiB mobile). The original full-size image stays in source but is excluded from deployed output. Quote calculation and submission code are unchanged.

### Repeatable measurements

The original observations are preserved in `seo/baselines/2026-11-04-rankings.json`. The fixed organic panel uses Los Angeles, English, desktop and depth 50. A missing rank means absent from the examined rows; it is never assigned position 51. The baseline's brand crosscheck remains separate because its provider disagreed with DataForSEO. Maps was #13 of 20 non-sponsored results in the audit; this organic collector does not refresh Maps.

- Preview rankings at no cost: `npm run seo:ranks`. Add `-- --include-long-tail` to preview all 28 distinct targets from the content catalog (currently estimated at $0.28); this also requires fresh spending authorization before live collection. The first observed long-tail ranks establish their own baseline, with no invented earlier positions.
- After fresh spending authorization, repeat the six-query panel: `npm run seo:ranks -- --live --budget 0.06`. This was the November 4 rate-card estimate; the per-call hard ceiling stops a higher reservation. Raw evidence is saved before parsing; failed/uncertain calls are not retried automatically.
- If any result domains remain unresolved, enrich the saved response at no Treg cost: `npm run seo:resolve -- seo/snapshots/RUN/rankings.json seo/snapshots/RUN/resolved-rankings.json`. This follows Google redirect headers without fetching external destination pages and preserves failures as unknown.
- Compare: `npm run seo:compare -- --baseline seo/baselines/2026-11-04-rankings.json --current seo/snapshots/RUN/resolved-rankings.json --output seo/snapshots/RUN/comparison.md` (use `rankings.json` directly if all domains were already known).
- Preview first-party exports: `npm run seo:metrics`. Fetch connected Search Console and GA4 reports with `npm run seo:metrics -- --live`; this uses team tools, not paid catalog endpoints.

All commands use the existing Treg CLI login in team `splendidmoving`; do not copy a token into this repository. Raw exports stay in ignored `seo/snapshots/` and are excluded from the web build. Do not publish those exports. Comparisons reject changed providers, location, language, device or depth and flag unresolved result domains. Brand and Maps require their separate audit settings if refreshed.

Check the fixed rank panel weekly and compare first-party performance across complete 28-day periods. No recurring paid job is installed. Search Console's empty responses mean data is unavailable; they do not prove zero traffic. GA4's tag began on November 4, so earlier periods cannot establish a fair before/after comparison. Track organic clicks/impressions and quote outcomes alongside ranks; page views alone are not booked moves. `seo/changes.json` records the release for later attribution. The initial content release used no additional paid calls; the later expanded snapshot and its separate approved spend are recorded below.

### November 4 production verification

Release `2e91b9e` deployed successfully through the Git integration. All 18 public URLs returned 200 with matching canonical URLs and parseable structured data. Desktop/mobile screenshots were reviewed for the homepage, blog index, service page, cost guide and quote form. The quote API returned its expected 405 to a GET probe; no lead was submitted. All 57 local checks pass after adding comparison support for newly measured long-tail queries.

Google accepted the sitemap (204), then reported that it had downloaded all 18 submitted URLs with no warnings or errors. This confirms sitemap processing, not individual page indexing. The four legacy paths reach their intended replacements with permanent redirects. The domain-level `www` redirect still returns 307 before project routing; the Vercel connector and existing CLI credential both lack access to this team, so changing that domain setting remains outstanding. The apex canonical URLs are live and consistent.

### Portfolio evidence

`seo/BASELINE.md` is the readable before/after record. `seo/baselines/2026-11-04-baseline.json` freezes the original technical, ranking, Maps and link metrics. Its 28 source evidence files are archived under `seo/evidence/2026-11-04-before/` with SHA-256 hashes; keep them unchanged. They are development evidence and are excluded from the deployed site. Later technical releases go in `seo/milestones/`; later rank exports stay in dated private snapshot folders. Do not relabel today's technical implementation results as ranking, traffic or revenue gains.

Fuel wording: the old local-page claim “No fuel surcharges” has been removed. The English, Spanish and Korean copy now states that a gas fee applies based on the route. The existing Gas Fee CRM field, calculation and quote handling are unchanged.

The first live Lighthouse homepage runs, recorded after release `2e91b9e`, scored mobile/desktop performance 73/97, accessibility 89/89, best practices 100/100 and SEO checks 100/100. These are starting lab measurements, not pre-release improvement claims or field Core Web Vitals. Full JSON and HTML reports, settings, timestamps and hashes are stored under `seo/evidence/2026-11-04-after/`; a compact summary is `seo/milestones/2026-11-04-performance-start.json`.

### Expanded ranking snapshot, November 4

The separately authorized 28-query panel is complete. Actual cost was **$0.276 of the approved $0.28**: 27 complete responses, one partial response and six zero-cost provider errors followed by inspected retries. No successful query was purchased twice. The saved snapshot covers 1,327 organic rows with zero unresolved domains; Splendid's website was absent from those examined rows. This is an initial measurement for the additional targets and establishes no ranking gain.

Start at `seo/2026-11-04-expanded-snapshot.md`. The permanent comparison baseline is `seo/baselines/2026-11-04-expanded-post-release.json`, with a CSV alongside it. Exact call IDs/charges and raw-response hashes live under `seo/evidence/2026-11-04-expanded/`. This evidence is excluded from the public web build. The original before-work files remain unchanged.

Read-only Search Console inspections recorded five indexed pages, eleven discovered/not indexed and two unknown to Google; see `seo/milestones/2026-11-04-indexing-start.json`. Raw inspection responses were saved, and the reads cost $0. All 61 mocked/offline tests pass, including redirect-resolution and partial-response comparison checks. Provider partial results retain their actual examined rows and are flagged as incomplete for ranking movement. No recurring paid collection is installed.

### Illustrated guides, November 4

The eight guides now have original topic-specific editorial covers and captions, a split article header on desktop, a complete image beneath the introduction on phones, and a collapsible mobile contents menu. `/blog` presents an illustrated gallery. Three articles also include lightweight explanatory diagrams for quote components, matching office labels to the floor plan, and separating fragile kitchenware.

Each guide's `image` metadata in `content/pages.json` owns its cover paths, dimensions, alt text and caption. Optional `diagram` selects its supporting diagram. `scripts/guide-visuals.js` renders responsive images and the static diagrams; `scripts/site-template.js` places them and keeps the article-specific BlogPosting/Open Graph/Twitter images consistent. The sitemap includes eight image URLs. Gallery thumbnails use lazy loading; article covers load eagerly with high priority and explicit dimensions.

Source PNGs and the full built-in image-generation prompts are in `design/blog-illustrations/`; they are excluded from the public build. Only the 640×360 and 1280×720 WebP variants in `assets/images/guides/` are deployed. The artwork is editorial illustration, not documentary images of customer jobs. The original article text, quote code and SEO baselines remain unchanged; `seo/changes.json` records the visual release separately. No additional Treg credit was used for the imagery update.

Validation: 61 existing automated checks pass; all 18 public pages pass local link/metadata checks. All eight covers, gallery entries and image-sitemap entries are present. Browser checks covered the index and eight article routes at 320, 390, 768, 1024 and 1440 pixels, with desktop/mobile screenshots and inspection of the inline diagrams. Mobile lazy images were verified by scrolling through the gallery.
