// Daily cleanup removes abandoned uploads after one day and submitted photo
// sets after 30 days. Only the hosting cron's secret can invoke this endpoint.
import { list, del } from "@vercel/blob";
import { read } from "../lib/quote/store.js";
import { photosReady } from "../lib/quote/photos.js";
export default async function handler(req, res) {
  if (
    !process.env.CRON_SECRET ||
    req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`
  )
    return res.status(401).json({ error: "Unauthorized" });
  if (!photosReady()) return res.status(200).json({ skipped: true });
  let cursor;
  let deleted = 0;
  try {
    do {
      const page = await list({ prefix: "quote-photos/", limit: 1000, cursor });
      const candidates = page.blobs.filter(
        (blob) => Date.now() - new Date(blob.uploadedAt).getTime() > 86400000,
      );
      const ids = [
        ...new Set(candidates.map((blob) => blob.pathname.split("/")[1])),
      ];
      const sessions = new Map(
        await Promise.all(
          ids.map(async (id) => [id, await read(`quote:photos:${id}`)]),
        ),
      );
      const expired = candidates.filter(
        (blob) =>
          Date.now() - new Date(blob.uploadedAt).getTime() > 30 * 86400000 ||
          !sessions.get(blob.pathname.split("/")[1])?.submitted,
      );
      if (expired.length) {
        await del(expired.map((blob) => blob.url));
        deleted += expired.length;
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return res.status(200).json({ deleted });
  } catch {
    return res.status(503).json({ error: "Photo cleanup needs review" });
  }
}
