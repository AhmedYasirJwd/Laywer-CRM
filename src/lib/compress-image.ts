// Client-side image compression for document uploads. Runs entirely in the
// browser (canvas re-encode) before the file is sent to the server, so a
// 12MP phone photo of a court order doesn't ship to Supabase Storage at
// full size. Non-image files pass through untouched.

// Formats a canvas can't safely round-trip: GIFs would lose animation,
// SVGs are vector (rasterizing them is a downgrade, not a compression),
// and HEIC/HEIF isn't reliably decodable via <img>/createImageBitmap
// across browsers yet — better to upload those as-is than risk a broken file.
const SKIP_TYPES = new Set(["image/gif", "image/svg+xml", "image/heic", "image/heif"]);

// Long-edge cap in pixels. Generous enough that scanned/photographed text
// stays sharp when zoomed in, while still bringing typical 3000-4000px
// phone-camera photos down substantially.
const MAX_DIMENSION = 2200;

// Re-encode quality for lossy formats (JPEG/WebP). High enough that the
// difference from the original is not visually perceptible.
const JPEG_QUALITY = 0.86;

export async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || SKIP_TYPES.has(file.type)) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    // Nothing to gain by re-encoding an already-small, already-compact image
    // — skip it rather than risk a pointless (or larger) re-save.
    if (scale === 1 && file.size < 350 * 1024) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    // PNG stays lossless (no quality knob) — resizing alone still shrinks
    // oversized screenshots/scans without touching pixel fidelity. Every
    // other raster type gets re-encoded as JPEG, which compresses
    // photographic content far better than PNG ever will.
    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, outputType, outputType === "image/jpeg" ? JPEG_QUALITY : undefined)
    );
    if (!blob) return file;

    // Safety net: only use the compressed version if it actually won.
    if (blob.size >= file.size) return file;

    const newName =
      outputType === "image/jpeg" && !/\.(jpe?g)$/i.test(file.name)
        ? file.name.replace(/\.[^.]+$/, "") + ".jpg"
        : file.name;

    return new File([blob], newName, { type: outputType, lastModified: file.lastModified });
  } catch {
    // If decoding/compression fails for any reason, fall back to the
    // original file rather than blocking the upload.
    return file;
  }
}
