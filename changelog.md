# Project changelog

This file records meaningful changes and the checks actually performed. Earlier release history remains in the README, SEO plan and milestone records.

## 2026-11-25 — Improve priority service pages and the cost guide
- Added direct service copy, clear published rates/minimum, contextual links and attributed company photography to apartment, small-move and packing pages. Added packing FAQs and an interactive hourly subtotal calculator to the cost guide, using the existing quote rates and explicit fee limits.
- Verified locally: 70 tests, all 18 public pages, sixteen responsive browser checks, six crew/payment combinations, minimum/invalid/fractional hours, keyboard FAQs and no-JavaScript fallback. Desktop/mobile screenshots reviewed. Local Lighthouse accessibility and SEO both scored 100 on packing and the cost guide.
- Released: `cead714` received successful Vercel status. All 18 live HTML pages, content CSS, calculator module, sitemap and feed match the tested build; eight live desktop/mobile checks and calculator/keyboard checks passed. All 12 selected calculator mutations were caught in an isolated offline check. Fresh first-party before-reports and review evidence stay private; no new ranking gains claimed, paid Treg calls or customer submissions. Manual recrawl remains optional and requires Search Console sign-in.

## 2026-11-18 — Replace photos with branded crew and a scenic highway
- Replaced the two earlier job photos with a Yelp team portrait showing all three movers in matching navy Splendid shirts and a company-posted Google Maps photo of wrapped furniture with no people. Searched both platforms; Google exposed ten public photos before requiring sign-in. Saved exact source details and replaced the desert truck image with a generated green-foothill highway scene.
- Verified locally: all 67 tests and 18-page build/link/metadata checks pass. Reviewed desktop and phone screenshots of all four affected pages and the three mobile cards; confirmed loaded images and no horizontal overflow at 320, 390, 768 and 1440px. Delivery images are about 54–329 KiB each. No additional paid data calls.
- Released: `e3cc7fb` received a successful Vercel deployment status. All 18 live HTML pages, the stylesheet and six photo files match the tested build byte for byte. Eight live desktop/mobile browser checks passed with screenshots, loaded replacement images and no horizontal overflow.

## 2026-11-18 — Add service photography
- Added faded photo headers to all three homepage service cards and image-only banners to the three main service pages, keeping their existing introductions and quote links. Used two real Yelp job photos and a generated desert-highway truck photo; saved sources, attribution and the generation prompt outside the public build.
- Verified locally: all 67 tests pass; the 18-page build, local-link, metadata and JSON-LD checks pass. Browser screenshots reviewed at desktop and phone widths; all 36 combinations of three service pages, EN/ES/KO and 320/390/768/1440px have loaded images and no horizontal overflow. Adjusted closed mobile navigation and long translated text for the service-page layout. Delivery images are about 30–156 KiB each.
- Released: `3f654e8` received a successful Vercel deployment status. All 18 live HTML pages, the shared stylesheet and six delivery images match the tested build byte for byte. Eight live desktop/mobile browser checks passed with screenshots, loaded images and no horizontal overflow. The generated highway image is illustrative, not a documented company trip.

## 2026-11-16 — Refresh SEO measurements and prioritize next work
- Collected all 28 matched LA desktop rankings, complete after bounded retries and free redirect resolution. Preserved earlier snapshots; verified their saved hashes and reconciled $0.282 in charges under the announced $0.35 ceiling.
- Verified: all 18 live pages match the saved build; status, canonical, metadata and JSON-LD checks pass. All 18 Google URL inspections report indexed. Connected Analytics reports return the registered fields; complete Search Console data ends November 14. Detailed traffic/enquiry evidence remains private.
- Next: request recrawls for revised priority pages, add verified job evidence to existing opportunities, audit local presence separately, and compare matching weekly windows. These actions remain recommended. No application code/customer action/recurring job changed; application tests were not rerun for this audit/documentation update.

## 2026-11-13 — Complete Google Analytics reporting setup
- Enabled `generate_lead` as a key event and registered event-scoped quote type, source page and link location in the existing Splendid Moving property.
- Verified: signed-in Google Admin UI, independent Treg Admin API readback, Data API metadata, and exact parameter/scope checks. Private before/after evidence and screenshots are saved; the milestone contains the completion record.
- Reports may take 24–48 hours to populate new dimension values. Treg remains read-only but can read the completed configuration. No website code change, customer test quote or paid Treg call; application tests were not rerun for this settings/documentation change.
