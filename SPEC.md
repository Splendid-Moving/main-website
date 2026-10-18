# Address-first quote form and automatic local quotes

This plan rebuilds Splendid Moving's quote form as one question at a time, starting with pickup and drop-off addresses. Local moves receive an automatic text quote; long-distance moves collect photos or an item list for the team to prepare a flat price.

## Contract

GOAL: All four website pages link to `/quote`, where customers select full addresses first and continue through the correct local/long-distance questions one at a time. After an eligible local request is saved in GoHighLevel, send the personalized SMS quote, targeting API acceptance within 30 seconds. Long-distance requests reach the team with inventory/photos for manual flat pricing and never receive the hourly quote.

CONSTRAINTS:
- Extend `main_website`; keep its existing contact fields, source tracking, returning-customer handling, tags, and notification trigger.
- Use fixed rules and the supplied quote text. No AI model, booking, invoice, deposit, or estimated total labor charge.
- Cash/card hourly rates: 2 movers $115/$125; 3 movers $145/$155; 4 movers $180/$190. All have a 3-hour minimum.
- Studio or 1 bedroom → 2 movers; 2 bedrooms → 3 movers; 3 bedrooms or the existing 4+ Bedroom option → 4 movers. Keep the 4+ option intact, per the user.
- Base for this calculation is `90015, Los Angeles, CA, USA`, as supplied. Do not substitute the ops-agent's different depot address.
- Use actual Google Maps Routes driving distance. Sum base → pickup + pickup → drop-off + drop-off → base; divide total meters by 1609.344 and round once to the nearest whole mile.
- Rounded-mile tiers: 0–35 → $30; 36–55 → $50; 56–75 → $60; 76–120 → $70; 121–170 → $80; 171–250 → $100. Minimum is $30.
- Our script classifies a move as long-distance when base → pickup → drop-off → base exceeds 250 miles; Google only supplies driving distances. Compare the unrounded total for this cutoff, then round local mileage once for the gas tiers.
- For an established local move, Google error, timeout, missing key, empty route, or incomplete distance data → send the quote with the whole gas-fee line omitted and flag manual gas pricing; never invent a fee or send `???`.
- Long-distance moves never receive this hourly quote. Require photos or a written inventory for in-form submission; recommend photos more strongly because they help produce a more accurate price. Photos must be attached directly in the quote form. Deliver long-distance requests to `info@splendidmoving.com` through the existing Resend account; do not require a separate customer email.
- Mileage lookup failure → send the hourly SMS without the whole gas-fee line and notify the team, explicitly confirmed by the user even though distance classification is unavailable. Record classification as unknown rather than inventing mileage or labelling it local.
- Respect the contact's messaging restrictions and record messaging failures for manual follow-up. A provider rejection cannot be treated as delivery.
- Nikita explicitly requested finishing and activating the automation on 2026-10-18. No Redis requirement. A returning customer’s fresh submission updates the matching phone contact and sends a new eligible quote immediately, even if details match an earlier request.

FORMAT:
- A standalone, directly shareable `https://splendidmoving.com/quote` page using the same submission logic as the existing site form; accessible without opening a modal or visiting the homepage first.
- One local quote as SMS in the existing GHL conversation; no automatic hourly quote for long-distance requests.
- One progressive form at `/quote`, linked by the homepage and all three service pages; accessible Back/Continue controls and preserved answers.
- Preserve the site's English, Spanish, and Korean form support; any new questions and outcomes need matching translated strings.
- Long-distance requests save/update the GHL contact and reach `info@splendidmoving.com` via Resend, with photos attached, a written inventory if supplied, customer reply-to, and the complete move details. Keep CRM follow-up for manual flat pricing.
- A GHL follow-up task/note for missing gas pricing, oversized trips, unsupported move sizes, or failed/uncertain message sends.
- Small, plainly named modules for pricing, route distance, quote formatting, and delivery coordination; meaningful tests runnable with `npm test`.
- Environment-variable template and README explain setup, dry run, activation, and manual recovery without exposing secrets.

FAILURE (any of these = not done):
- Crew size, hourly rates, minimum hours, or preserved quote wording differ from the agreed rules.
- Distance uses a straight line, omits a leg, doubles a one-way distance, rounds individual legs, or applies a tier before rounding the total.
- Any tier boundary is wrong, or a trip exceeding 250 miles receives an automatic gas price.
- Maps failure prevents an otherwise eligible quote from sending, or leaves a gas label, placeholder, zero-dollar fee, or guessed fee in the customer message.
- Manual-pricing cases are only logged with no visible CRM follow-up; failures to create that follow-up are not surfaced.
- New contacts work but returning contacts fail, lose existing tags, or send stale move details.
- A retry of a completed submission sends another quote, a fresh request is blocked as a duplicate, or an uncertain SMS timeout triggers a blind resend. Separate-worker simultaneous races are a documented limitation of the CRM-only design.
- A messaging failure makes the browser ask the customer to resubmit a lead already saved successfully, or is reported as a delivered quote.
- Automatic sending runs without confirmed channel/move-size rules, bypasses a channel restriction, or exposes credentials/customer payloads in logs.
- Current owner notifications stop working or an existing GHL workflow also sends the same quote.
- Long-distance requests receive an hourly quote, use a stale address classification, or lose the inventory/photos before CRM handoff.
- Back navigation loses answers; address edits fail to invalidate the route; hidden questions block submission; the flow cannot be completed on a phone or with a keyboard.
- Photo uploads exceed limits without guidance, expose private uploads publicly, or fail silently while the form reports inventory received.

## Form flow and design

- Shared opening: full pickup and drop-off addresses together, selected from the original Google Places dropdowns → route check → move size → move date. No ZIP-only step or repeated address questions; manual full-address entry is available if Google suggestions fail.
- Local continuation: first name → last name → phone → email → optional details → review and request quote. Keep all existing CRM fields and UTM tracking.
- Long-distance continuation: photos (recommended: “Photos help us give you a more accurate price”) or written inventory → access details at both properties (optional) → first name → last name → phone → email → review and request flat-price estimate. Attach photos in the form, with a thumbnail/removal review; no separate-email workaround and no automatic hourly quote.
- One visible question per step; inventory may offer a choice between photos and text. Continue validates the current answer; Back preserves answers. Route/upload loading, retry, and error states are explicit.
- Keep address autocomplete but permit manual address entry if Places fails; do not make a Google outage prevent lead intake. Unknown mileage continues through the standard questions, sends the gas-free hourly SMS, and notifies the team.
- Address changes cancel/ignore stale route responses, clear classification/gas results, and recompute. Server validates the route result against the submitted addresses; never trust a client-supplied local flag or fee.
- Retain navy/blue branding and existing fonts. Center one compact form with no side photograph; use a quiet background and smooth directional swipe transitions between steps, with no motion for reduced-motion preferences. Keep visible keyboard focus and one clear primary button.
- The form is also available as a full standalone `/quote` page; existing site buttons can link there. Phone layout reserves room for the keyboard and address suggestions. Review at 360/390/768/1440px; physical phone/Safari behavior must be reported separately if untested.

## Quote text

Preserve the user's wording and paragraph order; replace only first name, mover count, hourly rates, and the optional gas-fee line. Plain text must retain line breaks and use actual list hyphens rather than escape characters.

```text
Hi {{first_name}}!

Thank you for considering Splendid Moving.

Based on the details you've provided, we would recommend you to go with a team of {{movers}} movers.

The rate for {{movers}} movers would be:

Cash: ${{cash_rate}} per hour
Card: ${{card_rate}} per hour
Minimum charge: 3 hours

{{optional_gas_fee_line}}

The rate includes:
- Truck, mileage, and tax.
- Basic value protection at $0.60 per pound per article.
- Disassembly and reassembly of furniture.
- Packing and unpacking services.
- Moving blankets for furniture protection.
- Wardrobe boxes for clothes.
- No hidden charges!

We provide free tape and shrink wrap.

Note: Other materials such as boxes and bubble wrap are available for an additional charge.

Double Drive Time: This applies if the driving distance is over 15 miles. The cost is calculated by doubling the time it takes to drive between your pick-up and drop-off addresses.
```

For local quotes, the optional line is exactly `Gas fee: $<fee>`. On failure, remove that line and collapse the extra blank paragraph. Keep the Double Drive Time wording in local quotes; this feature does not calculate that charge.

## Built on top of

- Existing Node/Vercel API and GHL HTTP integration; rates independently match local `index.html`, `BRAND_INFO.md`, and `ops-agent/services/rates.py`.
- [Google Routes Compute Routes](https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes): one request with the base as origin/destination and pickup/drop-off as ordered stopovers. `DRIVE`, `TRAFFIC_UNAWARE`, no waypoint optimization; request only distance fields.
- [GHL Send Message](https://marketplace.gohighlevel.com/docs/2021-07-28/ghl/conversations/send-a-new-message/): retain direct HTTP for this narrow integration. Verify payload/sender configuration before activation; use contact tasks/notes for manual pricing.
- Native Node test runner and mocked HTTP for repeatable tests with no customer sends.
- GoHighLevel notes record each request ID, fingerprint, phase, outcome, and SMS message ID. Same-request replays reuse the result; new request IDs are never suppressed by matching contact/details. No extra database.
- Reuse existing Sentry for operational failures; redact tokens and customer message/address payloads.
- Reuse Splendid support-agent email conventions: existing Resend account/sender, navy banner, compact detail rows, customer Reply-To, native attachments, and stable per-request idempotency keys. HEIC uses separately loaded `heic-to` 1.6.6 (LGPL-3.0; license/source provided), matching libheif 1.23.6.

## Gotchas we're handling

- The browser keeps a stable request ID across retries. Same-worker simultaneous retries share one promise; persisted GHL notes handle later retries. GHL notes are not an atomic cross-worker lock: simultaneous requests on separate instances may overlap. Do not claim global exactly-once delivery.
- Record the sending phase in GHL before calling its SMS endpoint; record accepted/failed/uncertain afterward. A CRM-note write failure saves the lead for manual handling. No Redis or file-storage gate for routing/SMS.
- Set a short Maps timeout, catch all Maps failures, and validate all three legs. No fallback to the older Distance Matrix helper used for calendar notes.
- Save/update the contact before quote delivery. A saved lead remains a successful form submission even if sending fails; return and record the separate quote outcome.
- Track pending/accepted/failed/uncertain delivery by submission and channel. A timeout after a send may mean the message exists: reconcile in GHL before resending, since the send endpoint has no documented idempotency key.
- An accepted/queued GHL message is not proof of handset or inbox delivery. Record message IDs and surface subsequent failure through available provider status reporting.
- Check existing notification/quote workflows before activation to avoid double sends. Keep quote sending behind an explicit configuration switch.
- Restrict a separate server-side Google key to Routes API and confirm billing/access; never reuse a browser referrer-restricted key by assumption.
- Honeypot, origin checks, validation, and bounded per-worker IP limits cover the public form. Temporary mileage caches reduce repeat calls; neither requires a database.
- Keep photo files in the browser until final submission. Prepare clear copies up to 1600px, sequentially, with a 2 MiB total byte budget to fit Vercel’s 4.5 MB request cap. Allow 10 originals at 15 MB each. JPEG/PNG/WebP and HEIC/HEIF are converted to JPEG; validate bytes on the server, then attach directly to the office email. No storage account, public URLs, or photo-gallery password.

## Build sequence

1. Confirm the open business decisions below and review this plan.
   Immediate standalone-page increment requested on 2026-10-18: add `/quote` using existing intake before the broader automation work. Before delivery, check direct navigation/reload, valid and failed submissions with mocked CRM, keyboard/phone layout, translations, source tracking, and existing form regression.
2. Write failing tests for local/long-distance branching, exact rates/template, all gas tier edges/rounding, >250 handling, Maps failures, and address changes.
3. Build the shared one-question form and route check; verify Back/Continue, keyboard, mobile, and route-unknown states.
4. Implement inventory/photo intake, CRM handoff, durable submission/delivery tracking, and SMS integration for both new/returning contacts. Test concurrency, uncertain sends, upload failures, and manual follow-up.
5. Document setup, run the suite, and exercise both branches in a real local browser with external services mocked and screenshots inspected.
6. Review dry-run quote samples, live configuration, current workflows, and an explicitly authorized test recipient before enabling production sends.

## How to run and test

- Existing API development command: `npm run dev` (Vercel CLI required). `npm start` serves static files only.
- Tests: `npm test` — 47 passing, external services mocked. `npm run build` and `git diff --check` pass.
- Existing credentials: `GHL_ACCESS_TOKEN`, `GHL_LOCATION_ID`.
- Live Gas Fee field: `2nEnIoqxsJhlJQx74RJm`, `contact.gas_fee`, NUMERICAL. Authorized test confirmed writing $30 and restoring the empty value; no calendar/job-note trigger fields were touched.
- Every test must use only contact phone `8185054576`; mock CRM sends during automated/browser checks. No other real contact is authorized for testing.
- Configuration is documented in `.env.example` and README: Routes key, existing Resend sender/key, office recipient, task assignee, and the automatic-send switch (off by default).
- Real authorized new-contact test delivered SMS `IPhnVxdkAuXTmTulZ5eZ` with the three-mover rate and $30 gas. Same-request retry returned the same message ID. Live returning quote `C7lqy1wqFk0gOv9qlSey` also delivered; same contact updated to 4+ bedrooms, $30 gas, and flexible date. Production retry reused its message ID; exactly two quote texts exist. Long-distance inventory/manual-task flow verified with no SMS.

## Status

_Updated: 2026-10-18_
- Address-first `/quote`, gas calculation, and automatic GHL SMS are live from `main` commit `1310e46`. `AUTO_QUOTES_ENABLED=true` and the existing operations task assignee are configured in production. Redis dependency removed.
- Core changes pass 47 checks: phone-first contact lookup/update, new-request re-quotes even with identical details, same-request retry receipts in GHL notes, no-Redis gas/SMS, failures/DND/manual branches. Blank new dates clear old dates.
- Recreated deleted test contact `7QEmujHBzyoV5LNCtfxw` on `8185054576`; new and returning quotes both delivered, with $30 gas. Same contact updated to 4+ bedrooms and old date cleared. Identical-request retry reused its message ID; exactly two quote messages exist.
- Live checks passed: local round trip 29 miles / $30; long-distance circuit 768 miles requires inventory and creates assigned manual-pricing task without hourly SMS. Mobile confirmation/inventory reviewed, task Playwright session closed. Deploy only through `main` pushes; no Vercel CLI.
- Current increment: finish direct in-form photo attachments and Resend office delivery; fix native mobile date/control overflow. 47 automated checks; Chrome and WebKit passed all 11 steps at 320/360/390/430/768/1440px (132 layout checks). Preview/add/remove, HEIC fallback, EN/ES/KO, ten-photo sizing (2.42 MB JSON), and failed-send retry passed. A real WebKit form test emailed two optimized photos to the office via Resend (accepted, no hourly SMS); production deployment verification is next.
- Limits: GHL notes are not an atomic cross-worker lock; limits/cache are per worker. Photo copies are optimized for email, not original-resolution archives. Physical devices remain untested; mobile engine checks include WebKit. Preserve booking/calendar fields and test only the authorized phone.
