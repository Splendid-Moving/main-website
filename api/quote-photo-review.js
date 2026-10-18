// Staff-only review of a customer's private photo set. The CRM links here;
// every request requires the configured review password, never a public gallery.
import { timingSafeEqual, createHash } from "node:crypto";
import { read } from "../lib/quote/photo-store.js";
import { photoUrl } from "../lib/quote/photos.js";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  const supplied = Buffer.from(
    String(req.headers.authorization ?? "").replace(/^Basic /, ""),
    "base64",
  )
    .toString()
    .split(":")
    .slice(1)
    .join(":");
  const digest = (value) => createHash("sha256").update(value).digest();
  if (
    !process.env.QUOTE_PHOTO_REVIEW_PASSWORD ||
    !timingSafeEqual(
      digest(supplied),
      digest(process.env.QUOTE_PHOTO_REVIEW_PASSWORD),
    )
  ) {
    res.setHeader(
      "WWW-Authenticate",
      'Basic realm="Splendid photo review", charset="UTF-8"',
    );
    return res.status(401).send("Staff sign-in required.");
  }
  const id = String(req.query.request ?? "");
  if (!/^[a-f0-9-]{36}$/i.test(id))
    return res.status(400).send("Invalid request.");
  try {
    const session = await read(`quote:photos:${id}`);
    if (!session?.submitted)
      return res.status(404).send("Photos are unavailable or have expired.");
    const images = await Promise.all(
      session.files.map(async (file, index) => {
        const url = (await photoUrl(file.pathname))
          .replaceAll("&", "&amp;")
          .replaceAll('"', "&quot;");
        return `<figure><a href="${url}">Download photo ${index + 1}</a><br><img src="${url}" alt="Inventory photo ${index + 1}" loading="lazy" style="max-width:100%;max-height:75vh"></figure>`;
      }),
    );
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; img-src https://*.private.blob.vercel-storage.com; style-src 'unsafe-inline'",
    );
    return res
      .status(200)
      .send(
        `<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Inventory photos | Splendid Moving</title><body style="font:16px system-ui;max-width:960px;margin:40px auto;padding:0 20px"><h1>Inventory photos</h1><p>Private customer photos. HEIC images may need to be downloaded to view.</p>${images.join("")}</body></html>`,
      );
  } catch {
    return res.status(503).send("Photo review is temporarily unavailable.");
  }
}
