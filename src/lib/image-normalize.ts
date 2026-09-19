import { getCloudflareContext } from "@opennextjs/cloudflare";

const ALREADY_WEB_SAFE = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export type NormalizedImage = {
  buffer: ArrayBuffer;
  contentType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  ext: "jpg" | "png" | "webp" | "gif";
};

function extForContentType(contentType: NormalizedImage["contentType"]) {
  if (contentType === "image/png") return "png" as const;
  if (contentType === "image/webp") return "webp" as const;
  if (contentType === "image/gif") return "gif" as const;
  return "jpg" as const;
}

/**
 * Normalize any common camera/phone format (HEIC, HEIF, TIFF, …) to a
 * browser-friendly JPEG via the Cloudflare Images binding. Web-safe inputs
 * pass through unchanged.
 */
export async function normalizeImageForStorage(
  buffer: ArrayBuffer,
  mimeHint?: string | null,
): Promise<NormalizedImage> {
  const mime = (mimeHint || "application/octet-stream").toLowerCase();

  if (ALREADY_WEB_SAFE.has(mime) && mime !== "image/jpg") {
    const contentType = mime as NormalizedImage["contentType"];
    return {
      buffer,
      contentType,
      ext: extForContentType(contentType),
    };
  }
  if (mime === "image/jpg") {
    return { buffer, contentType: "image/jpeg", ext: "jpg" };
  }

  // HEIC/HEIF/TIFF/BMP/unknown → JPEG via Cloudflare Images (HEIC supported)
  try {
    const { env } = await getCloudflareContext({ async: true });
    const images = (env as { IMAGES?: ImagesBinding }).IMAGES;
    if (!images) {
      throw new Error("IMAGES binding unavailable");
    }

    const input = new Response(buffer).body;
    if (!input) throw new Error("empty image stream");

    const result = await images
      .input(input)
      .transform({ width: 2000, fit: "scale-down" })
      .output({ format: "image/jpeg", quality: 85 });

    const response = result.response();
    const out = await response.arrayBuffer();
    if (!out.byteLength) throw new Error("empty conversion output");

    return { buffer: out, contentType: "image/jpeg", ext: "jpg" };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "convert failed";
    throw new Error(
      `Could not convert ${mime} for upload (${detail}). Try sending as a JPEG/PNG, or as a Telegram Photo.`,
    );
  }
}

/** Minimal type for the Cloudflare Images binding used here. */
type ImagesBinding = {
  input: (stream: ReadableStream) => {
    transform: (opts: Record<string, unknown>) => {
      output: (opts: {
        format: string;
        quality?: number;
      }) => Promise<{ response: () => Response }>;
    };
  };
};
