# Service photography

These sources supply the three homepage service cards and the image-only banners on the three main service pages. Only the optimized WebP files in `assets/images/services/` are included in the public build.

## Real job photos

Both photographs were retrieved from [Splendid Moving's Yelp listing](https://www.yelp.com/biz/splendid-moving-los-angeles-3) on November 18, 2026. They are unaltered apart from delivery resizing and WebP compression; the homepage fade and responsive cropping are CSS treatments.

| Service | Original | Yelp photo |
| --- | --- | --- |
| Local moving | `source/local-apartment.jpg` | [Crew wrapping furniture in an LA apartment](https://www.yelp.com/biz_photos/splendid-moving-los-angeles-3?select=wa61l8HZZa4NFw3YKfClGw) |
| Commercial moving | `source/commercial-moving.jpg` | [Crew loading large equipment](https://www.yelp.com/biz_photos/splendid-moving-los-angeles-3?select=RX76aaxfabXVwfKuhc3O8g) |

The commercial image shows equipment handling; the listing does not identify the customer's job type. Do not present it as a verified office-relocation case study. The source response is preserved in `yelp-source.json`. Retrieval used Bright Data through Treg, call `3f1745c6af6a4694989397bc0fb73b8c`, costing $0.0015. The initial Crawl4AI attempt timed out and charged $0.

## Generated highway image

`source/long-distance-moving.png` was created with the built-in image-generation tool. It is a realistic illustrative photo of a white moving truck on a remote desert highway, not a photograph of the company's fleet or a documented customer move. The complete prompt is saved in `long-distance-prompt.txt`.

## Delivery and review

Each image has a 640px delivery copy plus a larger copy that preserves the original source resolution (992px for Yelp, 1600px for the highway). Hero images load eagerly with high priority and explicit dimensions; card photos load lazily. Mobile banners retain the complete frame; desktop banners use a wider crop, with a separate commercial focal position to retain faces.

Local browser screenshots are saved under ignored `output/playwright/service-photos/`. The build excludes this entire `design/` folder.
