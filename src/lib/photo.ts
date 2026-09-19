"use client";

import imageCompression from "browser-image-compression";

const MAX_DIMENSION = 1600;
const MAX_SIZE_MB = 0.4;

export async function compressPhoto(file: File): Promise<File> {
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: MAX_DIMENSION,
    maxSizeMB: MAX_SIZE_MB,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.82,
  });

  const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([compressed], name, { type: "image/webp" });
}
