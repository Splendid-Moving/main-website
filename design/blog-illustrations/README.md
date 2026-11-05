# Illustrated moving guides

Eight original editorial illustrations give each guide a recognizable topic and make the blog index easier to scan. The source PNGs and full generation prompts are kept here; only the optimized WebP versions are published.

## Design

- Palette: Splendid navy `#032449`, blue `#188bf6`, white `#ffffff`, pale blue-gray `#edf5fc`, natural kraft brown and restrained plant green.
- Type: existing Space Grotesk headings and Plus Jakarta Sans body text.
- Layout: title and artwork side by side on desktop; a complete image beneath the introduction on mobile. The blog index becomes a two-column illustrated gallery, then a single column on phones.
- Detail: lightweight quote-component, desk-label and fragile-packing diagrams illustrate practical instructions. The article copy, rates and quote system are preserved.
- Restraint: images carry the visual identity. Navigation, reading text and quote actions use the existing design.

```text
Desktop article: [title + introduction] [full illustration + caption]
                [reading column]      [contents + quote]
Phone article:  [title] [illustration] [contents] [reading column]
Blog index:     [image + guide] [image + guide]
```

The illustrations were generated with the built-in `image_gen` tool after Nikita chose the editorial illustration direction. They are illustrative scenes, not documentary photographs of Splendid jobs. The final prompts and filenames are in [prompts.json](prompts.json); original artwork is in `source/`.

## Delivery

Publish files live under `assets/images/guides/`, in 640-pixel and 1280-pixel WebP sizes. Article headers use explicit dimensions and high-priority loading; gallery images load lazily. The same article-specific image appears in social previews, BlogPosting metadata and the image entries in the sitemap. Alt text describes the cover; thumbnails inside already named guide links use empty alt text to avoid repeating the link name.

The public build excludes this source directory and the original PNGs. Keep the original SEO baseline unchanged and record this visual release separately in `seo/changes.json`.

The sixteen optimized images total 692,560 bytes. Individual covers are 55,974–70,060 bytes, with 19,056–23,926-byte thumbnails. [manifest.json](manifest.json) records exact sizes and hashes for source and delivery files.

## Verified release

Release `250bf3d` deployed through the existing Git/Vercel connection. Production checks confirmed all eight article covers, eight gallery images, sixteen matching WebP files, eighteen sitemap URLs and eight sitemap image entries. Google accepted the updated sitemap with HTTP 204. A source PNG returned 404, and the quote API returned its expected 405 to a read-only GET. Desktop/mobile screenshots were inspected.

The `review/` folder preserves matched-size before/after screenshots of the live blog index and `verification.json` records the checks. These are visual implementation results, separate from the ranking and traffic baselines.
