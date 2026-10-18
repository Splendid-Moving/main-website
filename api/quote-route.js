// Checks full-address routing without saving a lead.
// The final submission recomputes the route independently before pricing.
import { accept, field, report } from "../lib/quote/http.js";
import { calculateRoute } from "../lib/quote/routing.js";
import { storeReady, hash, read, write } from "../lib/quote/store.js";
import { photosReady } from "../lib/quote/photos.js";
export default async function handler(req, res) {
  try {
    if (!(await accept(req, res, 30))) return;
    let pickup = field(req.body.pickup, "pickup"),
      dropoff = field(req.body.dropoff, "drop-off");
    if (!storeReady() || req.quoteRateLimited === false)
      return res
        .status(200)
        .json({
          status: "unavailable",
          classification: "unknown",
          gasFee: null,
          photoUploadsAvailable: false,
        });
    const key = `quote:route:${hash(JSON.stringify([pickup, dropoff]))}`;
    let route = await read(key);
    if (!route) {
      route = await calculateRoute(pickup, dropoff);
      if (route.status === "ok") await write(key, route, 300);
    }
    return res
      .status(200)
      .json({ ...route, photoUploadsAvailable: photosReady() });
  } catch (error) {
    await report(error);
    return res
      .status(error.status ?? 200)
      .json({
        status: "unavailable",
        classification: "unknown",
        gasFee: null,
        error: error.status ? error.message : undefined,
      });
  }
}
