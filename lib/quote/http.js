// Shared form API validation and response rules. Monitoring excludes customer
// addresses and message bodies, while retaining operational error status.
import * as Sentry from "@sentry/node";
import { rateLimit } from "./store.js";
import { validatePhotos } from "./photos.js";
Sentry.init({
  dsn: "https://d193da315f35a37e1176b4a6378feb26@o4511453136945152.ingest.us.sentry.io/4511453142188032",
  environment: process.env.VERCEL_ENV ?? "development",
  sendDefaultPii: false,
});
export async function report(error) {
  Sentry.captureMessage("Website quote operation needs review", {
    level: "error",
    extra: {
      operation: error?.operation ?? "quote",
      status: error?.status ?? null,
    },
  });
  await Sentry.flush(1000);
}
export async function accept(req, res, limit = 10) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return false;
  }
  if (req.headers.origin) {
    const host = new URL(req.headers.origin).host;
    if (
      host !== req.headers.host &&
      !["splendidmoving.com", "www.splendidmoving.com"].includes(host)
    ) {
      res.status(403).json({ error: "Origin not allowed" });
      return false;
    }
  }
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body))
    throw Object.assign(Error("Invalid form data"), { status: 400 });
  if (req.body.website) {
    res.status(200).json({ success: true });
    return false;
  }
  try {
    await rateLimit(req, limit);
    req.quoteRateLimited = true;
  } catch (error) {
    if (error.status === 429) throw error;
    req.quoteRateLimited = false;
    await report(error);
  }
  return true;
}
export function field(value, label, { required = true, max = 500 } = {}) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value)
  )
    throw Object.assign(Error(`Please check ${label}.`), { status: 400 });
  const cleaned = value.trim();
  if (required && !cleaned)
    throw Object.assign(Error(`Please enter ${label}.`), { status: 400 });
  return cleaned;
}
export function validateQuote(body) {
  const data = { photos: validatePhotos(body.photos) };
  for (const name of [
    "firstName",
    "lastName",
    "phone",
    "email",
    "addressFromFull",
    "addressToFull",
    "moveSize",
    "requestId",
  ])
    data[name] = field(body[name], name, {
      max: name.includes("address") ? 500 : 150,
    });
  for (const name of ["pickupZip", "dropoffZip"]) {
    data[name] = field(body[name] ?? "", name, { required: false, max: 5 });
    if (data[name] && !/^\d{5}$/.test(data[name]))
      throw Object.assign(Error("Enter valid 5-digit ZIP codes."), {
        status: 400,
      });
  }
  const digits = data.phone.replace(/\D/g, "");
  if (!/^(1)?\d{10}$/.test(digits))
    throw Object.assign(Error("Enter a valid US phone number."), {
      status: 400,
    });
  data.phone = digits.length === 10 ? `+1${digits}` : `+${digits}`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    throw Object.assign(Error("Enter a valid email address."), { status: 400 });
  data.email = data.email.toLowerCase();
  for (const name of ["inventory", "additionalDetails", "accessDetails"])
    data[name] = field(body[name] ?? "", name, { required: false, max: 10000 });
  for (const name of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ])
    data[name] = field(body[name] ?? "", name, { required: false, max: 500 });
  for (const name of ["firstName", "lastName"])
    data[name] = data[name].replace(/\s+/g, " ");
  data.moveDate = field(body.moveDate ?? "", "move date", {
    required: false,
    max: 10,
  });
  if (data.moveDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.moveDate))
    throw Object.assign(Error("Check your moving date."), { status: 400 });
  if (
    ![
      "studio",
      "1-bedroom",
      "2-bedroom",
      "3-bedroom",
      "4-bedroom",
      "office-small",
      "office-medium",
      "office-large",
      "labor-only",
    ].includes(data.moveSize)
  )
    throw Object.assign(Error("Choose a move size."), { status: 400 });
  return data;
}
