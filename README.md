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

Redis stores durable request records for 30 days. Identical new requests share a result for ten minutes; a stable request ID continues to prevent resends after a timeout or redeploy. Uncertain sends require checking the CRM conversation before resending. If tracking is unavailable, intake continues with manual follow-up and no automatic SMS.

## Setup before live activation

Copy the names from `.env.example` into the correct Vercel project's environment settings. Keep all real credentials out of git and never paste them into documentation.

1. Existing CRM settings: `GHL_ACCESS_TOKEN`, `GHL_LOCATION_ID`. Confirm access to contacts, notes/tasks, and sending conversation messages.
2. `GOOGLE_MAPS_API_KEY`: use a server-side key with **Routes API** enabled, correct restrictions, and billing. The browser Places key is separate. The existing shared server key returned HTTP 403 / PERMISSION_DENIED during this run, so it needs configuration before live gas calculation.
3. Connect an Upstash Redis database through `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. It provides atomic duplicate protection, route caching, and API rate limiting. Paid route lookups and automatic SMS do not run without this protection.
4. `GHL_QUOTE_ASSIGNEE_ID`: select the team member who receives manual-review tasks. Without it, tasks are unassigned; existing `website-lead` tagging is preserved.
5. For photos, connect a **private** Vercel Blob store and set `BLOB_READ_WRITE_TOKEN`, `QUOTE_SIGNING_SECRET`, and `QUOTE_PHOTO_REVIEW_PASSWORD`. Use separate long random secrets. Staff open the CRM's `/quote-photos?request=…` link and sign in with the review password; any username works. Photos never use public galleries.
6. Set `QUOTE_SITE_URL` to the actual site origin and `CRON_SECRET` for the daily photo cleanup. Abandoned uploads expire after one day; submitted photos are deleted after 30 days. The configured daily cron performs deletion, so verify it after deployment.
7. Leave `AUTO_QUOTES_ENABLED=false` while reviewing the form, workflows, configuration, and a test request. Set it to `true` only for live activation after that review.

Photos upload directly to private storage, with a maximum of ten images at 15 MB each. Supported originals are JPEG, PNG, WebP, HEIC and HEIF. Staff may need to download HEIC files to view them. The server validates file ownership, size, type, and file signatures. If uploads fail, the customer can retry, supply an item list, or email the team.

## Run and verify

- Install: `npm ci`.
- App/API development: `npm run dev` using the Vercel CLI and the intended project/environment.
- Static-only preview: `npm start`, then open `/quote.html`. Python's simple server does not provide `/quote` clean URLs or API routes.
- Automated checks: `npm test` — mocked network, no real messages.
- Build check: `npm run build` (static site; no frontend compilation).

**Every test uses only phone `8185054576`.** The authorized CRM record is named **Quote Form Test**, tagged `quote-form-test`, and has ID `BXNlxcsZGnPPURx5go1k`. No test SMS has been sent. Never create or test with another contact.

Verified locally: pricing/rounding boundaries, long-distance handling, Maps outages, numeric gas-field writes, returning-contact behavior, duplicate/uncertain sends, upload fallback, both browser submission branches, Back navigation, translations, and screenshots at 360/390/768/1440px. Physical phones/Safari and actual private-Blob uploads remain unverified. Deploy by pushing `main` through the existing Git integration; do not use Vercel CLI to deploy this project. Live automatic sending remains disabled until durable tracking and configuration are ready. Non-JSON server responses show a readable retry message instead of a parser error.

## Files

- `quote.html`, `styles/quote-page.css` — centered standalone form shell and design.
- `scripts/quote-form.js`, `quote-copy.js`, `quote-places.js` — steps, languages, and Google address selection.
- `lib/quote/` — fixed pricing, routing, CRM calls, durable tracking, validation, and private photos.
- `api/submit-quote.js`, `quote-route.js` — final intake and address-based route check.
- `api/quote-photo-*.js` — upload URLs, protected review, and retention cleanup.
- `tests/` — meaningful business-rule and CRM contract checks.
- `SPEC.md` — agreed behavior, limits, and current status.
