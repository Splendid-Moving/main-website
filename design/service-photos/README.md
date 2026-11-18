# Service photography

These sources supply the three homepage service cards and the image-only banners on the three main service pages. Only the optimized WebP files in `assets/images/services/` are included in the public build.

## Current real photos

The November 18 revision replaces the earlier photos of movers without company shirts. Real photographs are resized and compressed for delivery; all fading and responsive framing happen in CSS.

| Service | Original | Source |
| --- | --- | --- |
| Local moving | `source/local-crew.jpg` | [Yelp: three crew members in matching navy Splendid logo shirts](https://www.yelp.com/biz_photos/splendid-moving-los-angeles-3?select=puLyrc5hwIkKON4kPWOrSA) |
| Commercial moving | `source/commercial-packed-furniture.jpg` | [Google Maps: company-posted wrapped furniture and equipment, with no movers](https://www.google.com/maps/search/?api=1&query=Splendid%20Moving&query_place_id=ChIJszdgy_arLS0RnB55FLHPxEI) |

`selected-photos.json` records the current image URLs, Google photo ID, uploader, dates and search coverage. The Google image was posted by Splendid Moving in September 2022 (image capture June 2022); it is selected as the user's approved people-free fallback, not as evidence of a recent commercial job. The source does not establish the customer's job type, so do not label it as a verified office case study.

Both platforms were searched: reviewed the 25 Yelp listing photos retrieved earlier the same day, including full-resolution uniformed crew photos, and all ten photos in Google's public gallery. Google required sign-in to see more, and no login was performed. The original Yelp listing response remains in `yelp-source.json`; its successful retrieval cost $0.0015, while the earlier timed-out attempt cost $0. This revision used no additional paid data call.

## Generated highway image

`source/long-distance-moving.png` was created with the built-in image-generation tool. The revised scene puts a white moving truck on a clean, winding highway through green California foothills and mountains. It is illustrative, not a photograph of the company's fleet or a documented customer move. The complete current prompt is saved in `long-distance-prompt.txt`.

## Delivery and review

Each image has a 640px delivery copy and a larger copy (750px for the crew, 1200px for wrapped furniture, 1600px for the highway). Hero images load eagerly with high priority and explicit dimensions; card photos load lazily. Desktop and mobile use deliberate CSS crops. The local hero retains all three faces and shirt logos; the commercial crop emphasizes the protected furniture rather than the storage-space exterior or floor.

Local and production screenshots for this revision are saved under ignored `output/playwright/service-photos/revision/`. The build excludes this entire `design/` folder.
