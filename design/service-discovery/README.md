# Service discovery and focused answers

This November 11 update connects the existing service pages to the guides that describe their work. It preserves the guide designs and quote behavior while improving navigation, quick answers and text readability.

The homepage’s existing lower reading section now links to apartment moves, small moves, packing and small offices in a two-column desktop grid. The cost guide remains directly linked from the pricing section; its label supports English, Spanish and Korean. The local-moving page now points to packing alongside apartment and small moves.

Four guide paragraphs use context-specific service links. Apartment and small-office pages have native question disclosures with factual answers and useful next-step links. Their text is owned by named panels in `content/guide-panels.json`. These work with touch and keyboard and add no client-side JavaScript.

A related-page lookup previously searched only the new content catalog, silently dropping links to the older Commercial Moving and Long-distance Moving pages. The shared discovery catalog now includes those existing services, with descriptions read from their source pages. Missing configured relationships fail the build rather than disappearing. The regression test failed before this fix and passed afterward.

The navy/blue palette and existing typography remain. Small blue labels and links on light backgrounds have stronger contrast; the footer copyright is lighter on navy; labeled review-source icons have the appropriate image role. The local homepage accessibility and SEO audits both score 100. Those audit scores are not search positions.

`review/` contains desktop/mobile comparisons, 16 page/viewport checks including native disclosure interactions, six restored-link checks, and the local audit. Production verification is recorded after the Git deployment. Ranking evidence and private first-party exports remain separate under `seo/`.

Live review caught repeated FAQ headings caused by a Markdown paragraph around the new custom tags. The two new tags now use standalone HTML blocks, allowing the shared renderer to keep one heading and its accessible label. A regression test reproduced the duplicate before the correction.
