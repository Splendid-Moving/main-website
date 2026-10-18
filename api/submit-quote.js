// Saves the website request and, when explicitly enabled, sends its local SMS
// quote. Routing failures omit gas; long-distance requests go to manual pricing.
import { accept, validateQuote, report } from "../lib/quote/http.js";
import { calculateRoute } from "../lib/quote/routing.js";
import { processQuote } from "../lib/quote/automation.js";
import { saveContact, notify, sendSms } from "../lib/quote/crm.js";
import { storeReady, claim, read, write, release } from "../lib/quote/store.js";
import { verifyPhotos, markPhotosSubmitted } from "../lib/quote/photos.js";
export default async function handler(req, res) {
  try {
    if (!(await accept(req, res, 5))) return;
    if (!process.env.GHL_ACCESS_TOKEN || !process.env.GHL_LOCATION_ID)
      throw Error("CRM configuration unavailable");
    const input = validateQuote(req.body);
    const result = await processQuote(input, {
      enabled: process.env.AUTO_QUOTES_ENABLED === "true",
      route:
        storeReady() && req.quoteRateLimited !== false
          ? calculateRoute
          : async () => ({
              status: "unavailable",
              classification: "unknown",
              gasFee: null,
              totalMiles: null,
              roundedMiles: null,
            }),
      saveContact,
      notify,
      sendSms,
      verifyPhotos: async (data) => {
        const photos = await verifyPhotos(data);
        if (photos.length) await markPhotosSubmitted(data);
        return photos;
      },
      report,
      ...(storeReady() ? { claim, read, write, release } : {}),
    });
    return res.status(200).json(result);
  } catch (error) {
    await report(error);
    const status =
      !error.provider && error.status && error.status < 500
        ? error.status
        : 503;
    return res.status(status).json({
      error:
        status < 500
          ? error.message
          : "We could not save your request. Please try again or call (323) 645-2636.",
      ...(error.needsInventory ? { needsInventory: true } : {}),
    });
  }
}
