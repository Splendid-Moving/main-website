// Saves the website request and, when explicitly enabled, sends its local SMS
// quote. Routing failures omit gas; long-distance requests go to manual pricing.
import { accept, validateQuote, report } from "../lib/quote/http.js";
import { calculateRoute } from "../lib/quote/routing.js";
import { processQuote } from "../lib/quote/automation.js";
import {
  saveContact,
  findContact,
  getRequest,
  recordRequest,
  notify,
  sendSms,
} from "../lib/quote/crm.js";
import { verifyPhotos } from "../lib/quote/photos.js";
import { sendLongDistanceEmail } from "../lib/quote/long-distance-email.js";
export default async function handler(req, res) {
  try {
    if (!(await accept(req, res, 5))) return;
    if (!process.env.GHL_ACCESS_TOKEN || !process.env.GHL_LOCATION_ID)
      throw Error("CRM configuration unavailable");
    const input = validateQuote(req.body);
    const result = await processQuote(input, {
      enabled: process.env.AUTO_QUOTES_ENABLED === "true",
      route: calculateRoute,
      findContact,
      getRequest,
      recordRequest,
      saveContact,
      notify,
      sendSms,
      verifyPhotos,
      sendLongDistanceEmail,
      report,
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
        error.leadSaved || status < 500
          ? error.message
          : "We could not save your request. Please try again or call (323) 645-2636.",
      ...(error.leadSaved ? { leadSaved: true } : {}),
      ...(error.needsInventory ? { needsInventory: true } : {}),
    });
  }
}
