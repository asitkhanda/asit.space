import { getCloudflareContext } from "@opennextjs/cloudflare";

export type NormalizedImage = {
  buffer: ArrayBuffer;
  contentType: "image/webp" | "image/gif";
  ext: "webp" | "gif";
};

/**
 * Normalize camera/phone formats to WebP for the public site.
 * GIF is kept as-is (animation). Everything else → WebP via Cloudflare Images.
 */
export async function normalizeImageForStorage(
  buffer: ArrayBuffer,
  mimeHint?: string | null,
): Promise<NormalizedImage> {
  const mime = (mimeHint || "application/octet-stream").toLowerCase();

  if (mime === "image/gif") {
    return { buffer, contentType: "image/gif", ext: "gif" };
  }

  if (mime === "image/webp") {
    return { buffer, contentType: "image/webp", ext: "webp" };
  }

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
      .output({ format: "image/webp", quality: 82 });

    const response = result.response();
    const out = await response.arrayBuffer();
    if (!out.byteLength) throw new Error("empty conversion output");

    return { buffer: out, contentType: "image/webp", ext: "webp" };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "convert failed";
    throw new Error(
      `Could not convert ${mime} to WebP (${detail}). Try sending as a JPEG/PNG/WebP, or as a Telegram Photo.`,
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
