/**
 * Client-side image downscaling for the editor's image upload.
 *
 * kImage calls an optional `upload_handler(blob, success, progress, options)`
 * instead of its built-in uploader when one is configured (it must call
 * `success(responseData)` with `{ url, filename }`). We use that hook to shrink
 * large images IN THE BROWSER before they are sent, so huge originals never hit
 * the upload endpoint (which avoids serverless request-body limits) and stored
 * images stay small. Vector (SVG) and animated (GIF) images are left untouched.
 */

const SKIP_TYPES = new Set(["image/gif", "image/svg+xml"]);

/** Downscale a raster image Blob so its longest side is <= maxDim, re-encoding
 *  to WebP. Returns the original Blob if no resize is needed or possible. */
export async function resizeImageBlob(
  blob: Blob,
  maxDim: number,
  quality = 0.82,
): Promise<Blob> {
  if (
    typeof document === "undefined" ||
    !maxDim ||
    maxDim <= 0 ||
    SKIP_TYPES.has((blob.type || "").toLowerCase()) ||
    typeof createImageBitmap !== "function"
  ) {
    return blob;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    return blob; // undecodable here — let the server handle the original
  }

  const { width, height } = bitmap;
  const longest = Math.max(width, height);
  if (!longest || longest <= maxDim) {
    bitmap.close?.();
    return blob; // already small enough
  }

  const scale = maxDim / longest;
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return blob;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const out = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  return out && out.size > 0 ? out : blob;
}

type UploadSuccess = (data: { url?: string; filename?: string }) => void;
type UploadHandler = (
  blob: Blob,
  success: UploadSuccess,
  progress: ((loaded: number, total: number) => void) | undefined,
  options: { filename?: string } | undefined,
) => void;

/**
 * Build a kImage `upload_handler` that resizes the image client-side, then
 * POSTs it to `uploadUrl` (multipart field `file`) and forwards the JSON
 * response (`{ url, filename }`) to kImage via `success`.
 */
export function makeResizingUploadHandler(
  uploadUrl: string,
  maxDim: number,
  quality = 0.82,
): UploadHandler {
  return (blob, success, _progress, options) => {
    (async () => {
      try {
        const out = await resizeImageBlob(blob, maxDim, quality);
        const fd = new FormData();
        if (options?.filename) fd.append("file", out, "edited_" + options.filename);
        else fd.append("file", out);
        const res = await fetch(uploadUrl, { method: "POST", body: fd });
        if (!res.ok) {
          success({});
          return;
        }
        success(await res.json());
      } catch {
        success({}); // kImage treats an empty response as a failed upload
      }
    })();
  };
}
