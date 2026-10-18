// Photo-session manifests live alongside the images in private file storage.
// Mileage calculations and quote texts do not depend on this optional service.
import { get, put, BlobNotFoundError } from "@vercel/blob";
const path = (key) =>
  `quote-photo-sessions/${key.replace(/^quote:photos:/, "")}.json`;
export async function read(key) {
  try {
    const file = await get(path(key), {
      access: "private",
      useCache: false,
      abortSignal: AbortSignal.timeout(6000),
    });
    if (!file) return null;
    const record = await new Response(file.stream).json();
    return record.expires > Date.now() ? record.value : null;
  } catch (error) {
    if (error instanceof BlobNotFoundError) return null;
    throw error;
  }
}
export async function write(key, value, seconds = 86400) {
  await put(
    path(key),
    JSON.stringify({ value, expires: Date.now() + seconds * 1000 }),
    {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      abortSignal: AbortSignal.timeout(6000),
    },
  );
}
