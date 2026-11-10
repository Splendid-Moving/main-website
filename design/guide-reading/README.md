# Guide reading layouts

This update gives all eight moving guides practical visual structure inside the article body. Existing editorial covers remain in use; no new customer photographs or job stories were created.

## Direction

Royal Moving’s office guide and blog were reviewed as a reference for scannable reading: https://royalmovingco.com/blog/moving-office-business-la/ and https://royalmovingco.com/blog/. Splendid keeps its own navy `#032449`, blue `#0065c9` / `#188bf6`, pale blue `#deedff` and kraft-paper `#d7b589`, with the established Space Grotesk and Plus Jakarta Sans fonts.

The article sequence is introduction, a topic-specific overview, clearly separated reading sections, practical diagrams/checklists, and related illustrated guides. The desktop contents navigation precedes the smaller quote panel. Comparisons and price cards stack on phones; timelines represent actual preparation stages.

## Editing

Markdown contains named `<guide-panel name="…"></guide-panel>` markers. `content/guide-panels.json` owns their copy and example data. `scripts/guide-panels.js` renders semantic HTML, native checkboxes, a stair-route sketch, an inventory example and comparison/amount cards. `styles/guide-panels.css` owns the responsive layouts and print rules. No client-side framework or new image library is required.

The cost guide’s crew cards read the existing Markdown table, so rates have one source. Prices are hourly calculations with the existing minimum and fee caveats; no quote rules or backend code changed. Published dates remain November 4, with November 9 modification dates for the eight guides and two revised service pages.

## Review evidence

`review/` contains desktop/mobile office-guide comparisons. The wider local review includes all eight guides at 320, 390, 768 and 1440 pixels, native checklist interactions, mobile contents links and the two service pages. The narrow cost-card overflow found during review was corrected and rechecked. Runtime screenshots remain in ignored `output/playwright/guide-refresh-*`.

The original SEO snapshots and November 9 ranking follow-up remain unchanged. These are layout and usability results, not a new ranking measurement.
