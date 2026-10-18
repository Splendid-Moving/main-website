// Issues scoped, expiring upload URLs. Photo bytes go directly to private Blob
// storage instead of passing through the quote API's small request body.
import { accept, report } from "../lib/quote/http.js";
import { preparePhotos } from "../lib/quote/photos.js";
export default async function handler(req, res) {
  try {
    if (!(await accept(req, res, 3))) return;
    return res.status(200).json(await preparePhotos(req.body.files));
  } catch (error) {
    await report(error);
    return res
      .status(error.status ?? 503)
      .json({
        error: error.status
          ? error.message
          : "Photos could not be uploaded. Please use the item-list option or email your photos.",
      });
  }
}
