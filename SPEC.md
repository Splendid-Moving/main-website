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
- Long-distance moves never receive this hourly quote. Require photos or a written inventory for in-form submission; recommend photos more strongly because they help produce a more accurate price. Also offer contacting `info@splendidmoving.com` by email to supply inventory instead.
- Mileage lookup failure → send the hourly SMS without the whole gas-fee line and notify the team, explicitly confirmed by the user even though distance classification is unavailable. Record classification as unknown rather than inventing mileage or labelling it local.
- Respect the contact's messaging restrictions and record messaging failures for manual follow-up. A provider rejection cannot be treated as delivery.
- Customer-facing sending remains disabled during local development. Live activation follows a separate review of the tested implementation and configuration.

FORMAT:
- A standalone, directly shareable `https://splendidmoving.com/quote` page using the same submission logic as the existing site form; accessible without opening a modal or visiting the homepage first.
- One local quote as SMS in the existing GHL conversation; no automatic hourly quote for long-distance requests.
- One progressive form at `/quote`, linked by the homepage and all three service pages; accessible Back/Continue controls and preserved answers.
- Preserve the site's English, Spanish, and Korean form support; any new questions and outcomes need matching translated strings.
- Long-distance CRM record includes the inventory text and/or accessible photo attachments plus a manual flat-pricing task.
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
- Concurrent/retried processing of the same submission creates duplicate quotes; sender timeouts trigger blind resends.
- A messaging failure makes the browser ask the customer to resubmit a lead already saved successfully, or is reported as a delivered quote.
- Automatic sending runs without confirmed channel/move-size rules, bypasses a channel restriction, or exposes credentials/customer payloads in logs.
- Current owner notifications stop working or an existing GHL workflow also sends the same quote.
- Long-distance requests receive an hourly quote, use a stale address classification, or lose the inventory/photos before CRM handoff.
- Back navigation loses answers; address edits fail to invalidate the route; hidden questions block submission; the flow cannot be completed on a phone or with a keyboard.
- Photo uploads exceed limits without guidance, expose private uploads publicly, or fail silently while the form reports inventory received.

## Form flow and design

- Shared opening: full pickup and drop-off addresses together, selected from the original Google Places dropdowns → route check → move size → move date. No ZIP-only step or repeated address questions; manual full-address entry is available if Google suggestions fail.
- Local continuation: first name → last name → phone → email → optional details → review and request quote. Keep all existing CRM fields and UTM tracking.
- Long-distance continuation: photos (recommended: “Photos help us give you a more accurate price”) or written inventory → access details at both properties (optional) → first name → last name → phone → email → review and request flat-price estimate. Offer an email alternative; no automatic price or promise of an immediate flat quote.
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
- Durable Redis REST tracking is implemented, pending database connection: stable requests stay protected for 30 days; identical new submissions share results for ten minutes. In-memory flags or GHL tags alone cannot provide atomic protection.
- Reuse existing Sentry for operational failures; redact tokens and customer message/address payloads.
- [Private Vercel Blob](https://vercel.com/docs/vercel-blob/private-storage), Apache-2.0 SDK 2.8.2, implements direct scoped uploads and password-protected staff review; connection remains pending. Sentry upgraded to maintained 11.8.0 (MIT); dependency audit reports zero vulnerabilities.

## Gotchas we're handling

- The browser creates a stable request ID and retains it across retries; the server validates it and binds it to the submission payload. Concurrent retries share the recorded result. Review a short same-contact/same-move suppression window before activation.
- The ledger must exist before automatic sending is enabled. If unavailable, preserve lead intake and flag manual follow-up rather than risk sending duplicates.
- Set a short Maps timeout, catch all Maps failures, and validate all three legs. No fallback to the older Distance Matrix helper used for calendar notes.
- Save/update the contact before quote delivery. A saved lead remains a successful form submission even if sending fails; return and record the separate quote outcome.
- Track pending/accepted/failed/uncertain delivery by submission and channel. A timeout after a send may mean the message exists: reconcile in GHL before resending, since the send endpoint has no documented idempotency key.
- An accepted/queued GHL message is not proof of handset or inbox delivery. Record message IDs and surface subsequent failure through available provider status reporting.
- Check existing notification/quote workflows before activation to avoid double sends. Keep quote sending behind an explicit configuration switch.
- Restrict a separate server-side Google key to Routes API and confirm billing/access; never reuse a browser referrer-restricted key by assumption.
- Rate-limit/abuse protection must cover the public form before enabling automatic customer texts; choose a compatible host setting during setup.
- Photo uploads use a separate direct-upload path with enforced size/type/count limits, draft ownership checks, and private storage; never accept arbitrary browser-supplied URLs. Proposed cap: 10 photos, 15 MB each; JPEG/PNG/WebP/HEIC/HEIF, with filenames/status if previews are unsupported. Confirm storage access/retention before implementation; no public photo URLs in CRM notes.

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
- Tests: `npm test` — 37 passing, external services mocked. `npm run build` and `git diff --check` pass.
- Existing credentials: `GHL_ACCESS_TOKEN`, `GHL_LOCATION_ID`.
- Live Gas Fee field: `2nEnIoqxsJhlJQx74RJm`, `contact.gas_fee`, NUMERICAL. Authorized test confirmed writing $30 and restoring the empty value; no calendar/job-note trigger fields were touched.
- Every test must use only contact phone `8185054576`; mock CRM sends during automated/browser checks. No other real contact is authorized for testing.
- Configuration is documented in `.env.example` and README: Routes key, Redis REST, private Blob, review/signing/cron secrets, task assignee, and the automatic-send switch (off by default).
- Live `/quote` and server JSON validation verified. One real browser submission using only `8185054576` saved successfully with `quoteStatus: disabled`; both review notes/tasks were verified in GHL. No SMS sent.

## Status

_Updated: 2026-10-18_
- Live at `https://splendidmoving.com/quote`: centered `/quote` wizard, original Google full-address dropdowns, directional transitions, local/long-distance branching, photos/item-list/email options, gas calculation/field writes, and guarded SMS/CRM integration. Pushed `main` through the existing Git integration; Vercel reported successful deployment. Automatic SMS remains off pending durable duplicate protection and configuration.
- Verified: the form posts to `api/submit-quote.js`; both create/update paths save contacts; `website-lead` is intended as a workflow trigger. Local rate sources agree.
- Confirmed: SMS only; studio → 2 movers; retain 4+ Bedroom → 4 movers; progressive form; full base/pickup/drop-off/base circuit >250 miles means long-distance, no hourly quote. Require photos or item list, recommend photos, offer email alternative. Mileage failure → gas-free hourly SMS plus team notification.
- Verified: 37 automated checks; browser local success/retry and long-distance photo/list flows; Back, translated screens, reduced motion, and screenshots at 360/390/768/1440px. Authorized gas-field round trip verified. Production form test saved phone `8185054576` as contact `6SYEnctIIyIycRfBPIdB`, gas empty; two review notes/tasks verified, no SMS sent. Task Playwright session closed.
- Next: connect Redis/private Blob, configure task assignment/secrets, resolve Google Routes key permission (actual HTTP 403), review existing GHL workflows, then activate and verify automatic SMS. Deploy the form by pushing `main`; do not use Vercel CLI for this project. Overall production contract is pending these external setup checks.
- Watch out for: private Blob and real SMS delivery are not live-verified; physical phones/Safari remain untested. The form markup now lives only at `/quote`. Do not use another contact for tests or trigger booking/calendar workflows.
