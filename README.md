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

- Install: `npm ci`.
- App/API development: `npm run dev` using the Vercel CLI and the intended project/environment.
- Static-only preview: `npm start`, then open `/quote.html`. Python's simple server does not provide `/quote` clean URLs or API routes.
- Automated checks: `npm test` — 47 passing, mocked network, no real messages.
- Build check: `npm run build` (static site; no frontend compilation).

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
