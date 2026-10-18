// Prepare small, clear photo copies for a single secure quote-form submission.
// Native browser imaging handles ordinary photos; HEIC loads a separate decoder.
const TOTAL_BYTES = 2 * 1024 * 1024;
const MAX_ORIGINAL_BYTES = 15 * 1024 * 1024;
async function bitmapFor(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (error) {
    if (!/\.hei[cf]$/i.test(file.name) && !/image\/hei[cf]/.test(file.type))
      throw error;
    const { heicTo } = await import("/assets/vendor/heic-to.js");
    return heicTo({ blob: file, type: "bitmap" });
  }
}
const jpeg = (canvas, quality) =>
  new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(Error("Could not prepare photo")),
      "image/jpeg",
      quality,
    ),
  );
const base64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(Error("Could not read photo"));
    reader.readAsDataURL(blob);
  });
export async function prepareQuotePhotos(files, onProgress = () => {}) {
  if (
    !files.length ||
    files.length > 10 ||
    files.some((file) => file.size > MAX_ORIGINAL_BYTES)
  )
    throw Error("Choose up to 10 photos, no larger than 15 MB each.");
  const budget = Math.floor(TOTAL_BYTES / files.length);
  const photos = [];
  for (let index = 0; index < files.length; index++) {
    onProgress(index + 1, files.length);
    const bitmap = await bitmapFor(files[index]);
    const canvas = document.createElement("canvas");
    try {
      let edge = Math.min(1600, Math.max(bitmap.width, bitmap.height));
      let result;
      for (let attempt = 0; attempt < 12; attempt++) {
        const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext("2d");
        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        result = await jpeg(canvas, Math.max(0.5, 0.86 - attempt * 0.07));
        if (result.size <= budget) break;
        if (attempt >= 3) edge *= 0.8;
      }
      if (!result || result.size > budget)
        throw Error("Photo could not fit this request");
      photos.push({
        filename: `inventory-${String(index + 1).padStart(2, "0")}.jpg`,
        contentType: "image/jpeg",
        content: await base64(result),
        size: result.size,
      });
    } finally {
      bitmap.close?.();
      canvas.width = canvas.height = 1;
    }
  }
  return photos;
}
