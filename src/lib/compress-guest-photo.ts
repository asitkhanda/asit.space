/**
 * Client-side guest photo compression using Squoosh codecs
 * (@jsquash/jpeg MozJPEG + @jsquash/resize).
 */

const MAX_EDGE = 2048;
const MAX_OUTPUT_BYTES = 7 * 1024 * 1024; // leave headroom under the 8MB API limit
const QUALITY_STEPS = [80, 72, 64, 55, 45];

async function fileToImageData(file: File): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not read this photo.");
    ctx.drawImage(bitmap, 0, 0);
    return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}

function targetSize(width: number, height: number) {
  const edge = Math.max(width, height);
  if (edge <= MAX_EDGE) return { width, height };
  const scale = MAX_EDGE / edge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function compressGuestPhoto(file: File): Promise<{
  file: File;
  originalBytes: number;
  compressedBytes: number;
}> {
  const originalBytes = file.size;
  if (originalBytes <= MAX_OUTPUT_BYTES && file.type === "image/jpeg") {
    // Still normalize through MozJPEG for consistency on large-ish JPEGs,
    // but skip if already small enough that re-encode isn't needed.
    if (originalBytes <= 1.5 * 1024 * 1024) {
      return { file, originalBytes, compressedBytes: originalBytes };
    }
  }

  const encode = (await import("@jsquash/jpeg/encode")).default;
  const resize = (await import("@jsquash/resize")).default;

  let imageData = await fileToImageData(file);
  const sized = targetSize(imageData.width, imageData.height);
  if (sized.width !== imageData.width || sized.height !== imageData.height) {
    imageData = await resize(imageData, {
      width: sized.width,
      height: sized.height,
      method: "lanczos3",
      fitMethod: "stretch",
      premultiply: true,
      linearRGB: true,
    });
  }

  let best: ArrayBuffer | null = null;
  for (const quality of QUALITY_STEPS) {
    const buffer = await encode(imageData, { quality });
    best = buffer;
    if (buffer.byteLength <= MAX_OUTPUT_BYTES) break;
  }

  if (!best || best.byteLength > MAX_OUTPUT_BYTES) {
    throw new Error(
      "Couldn’t compress this photo under 8MB. Try a smaller image.",
    );
  }

  const base =
    file.name.replace(/\.[^.]+$/, "").trim() || "postcard-photo";
  const compressed = new File([best], `${base}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });

  return {
    file: compressed,
    originalBytes,
    compressedBytes: compressed.size,
  };
}
