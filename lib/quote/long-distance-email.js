// Send long-distance requests to the office through the existing Resend account.
// Photos are private attachments; Reply goes directly to the requesting customer.
import { hash } from "./store.js";
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const sizes = {
  studio: "Studio",
  "1-bedroom": "1 bedroom",
  "2-bedroom": "2 bedrooms",
  "3-bedroom": "3 bedrooms",
  "4-bedroom": "4+ bedrooms",
  "office-small": "Small office",
  "office-medium": "Medium office",
  "office-large": "Large office",
};
export async function sendLongDistanceEmail(
  input,
  contact,
  distance,
  photos = [],
  {
    key = process.env.RESEND_API_KEY,
    from = process.env.RESEND_FROM,
    to = process.env.LONG_DISTANCE_QUOTE_TO,
    fetch: request = globalThis.fetch,
  } = {},
) {
  if (!key || !from || !to)
    throw Error("Long-distance office email configuration is missing");
  const rows = [
    ["Customer", `${input.firstName} ${input.lastName}`],
    ["Phone", input.phone],
    ["Email", input.email],
    ["Pickup", input.addressFromFull],
    ["Drop-off", input.addressToFull],
    ["Move size", sizes[input.moveSize] ?? input.moveSize],
    ["Move date", input.moveDate || "Flexible"],
    [
      "Round-trip mileage",
      distance.totalMiles != null
        ? `${Math.round(distance.totalMiles)} miles`
        : "Unavailable",
    ],
    ["Item list", input.inventory || "See attached photos"],
    ["Access", input.accessDetails || "Not provided"],
    ["Additional details", input.additionalDetails || "None"],
    ["Photos", String(photos.length)],
    ["Request ID", input.requestId],
    ["GHL contact ID", contact.id],
  ];
  const subject =
    `Long-distance quote request — ${input.firstName} ${input.lastName} — ${sizes[input.moveSize] ?? input.moveSize} — ${input.moveDate || "Flexible date"}`.replace(
      /[\r\n]/g,
      " ",
    );
  const text = `LONG-DISTANCE QUOTE REQUEST\nFlat pricing required. No hourly quote was sent.\nReply to this email to contact the customer.\n\n${rows.map(([label, value]) => `${label}: ${value}`).join("\n\n")}`;
  const html = `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f6f9ff"><div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f6f9ff"><div style="background:#fff;border-radius:12px;padding:24px"><div style="background:#032449;color:#fff;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:600;margin-bottom:18px">Long-distance move — needs individual flat pricing.</div><h2 style="margin:0 0 4px;color:#032449;font-size:19px">Long-distance quote request</h2><p style="margin:0 0 18px;color:#5b6b7f;font-size:14px">Reply to this email to contact the customer. No hourly quote was sent.</p><table style="border-collapse:collapse;width:100%">${rows.map(([label, value]) => `<tr><td style="padding:7px 14px 7px 0;color:#5b6b7f;font-size:13px;vertical-align:top">${label}</td><td style="padding:7px 0;color:#032449;font-size:15px;font-weight:600;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word">${label === "Email" ? `<a href="mailto:${escape(value)}" style="color:#032449;text-decoration:none">${escape(value).replace("@", "<wbr>@<wbr>")}</a>` : label === "Phone" ? `<a href="tel:${escape(value)}" style="color:#032449;text-decoration:none">${escape(value)}</a>` : escape(value)}</td></tr>`).join("")}</table>${photos.length ? `<p style="margin:18px 0 0;color:#5b6b7f;font-size:14px">${photos.length} photo${photos.length === 1 ? "" : "s"} attached to this email.</p>` : ""}</div></div></body></html>`;
  const response = await request("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `splendid-long-distance/${hash(`${input.phone}:${input.requestId}`)}`,
    },
    body: JSON.stringify({
      from,
      to: to
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      reply_to: input.email,
      subject,
      text,
      html,
      ...(photos.length
        ? {
            attachments: photos.map(({ filename, content, contentType }) => ({
              filename,
              content,
              content_type: contentType,
            })),
          }
        : {}),
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw Object.assign(
      Error(`Office email provider rejected the request (${response.status})`),
      { status: response.status, operation: "long-distance-email" },
    );
  const result = await response.json();
  if (!result.id) throw Error("Office email provider returned no message ID");
  return result;
}
