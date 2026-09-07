// Client-side photo compression before upload. Phone cameras routinely
// produce 3–8MB, 4000px-wide JPEGs; nothing in this app ever displays a
// photo larger than a full phone screen, so re-encoding down to a sane
// max dimension at high JPEG quality cuts upload size dramatically with no
// visible quality loss. Fails soft everywhere — any error, or a result
// that isn't actually smaller, falls back to the original file untouched.
const MAX_DIMENSION = 2048; // long edge, in px — sharp even full-screen on a 3x-retina phone
const JPEG_QUALITY = 0.9; // ~90%: the point past which artifacts stop being visible
const SKIP_BELOW_BYTES = 600 * 1024; // already small enough — don't bother re-encoding

export async function compressImage(file) {
  if (!file || !file.type?.startsWith("image/") || file.size <= SKIP_BELOW_BYTES) {
    return file;
  }

  try {
    // `imageOrientation: "from-image"` bakes in the EXIF rotation so the
    // canvas draw below doesn't need to (and the compressed file doesn't
    // carry EXIF at all, so orientation must be resolved here).
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
