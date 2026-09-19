import exifr from "exifr";

export type ExifMeta = {
  occurredAt: Date | null;
  lat: number | null;
  lng: number | null;
};

/** Coerce EXIF date values (Date instance or "YYYY:MM:DD HH:mm:ss" string). */
export function coerceExifDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "string" && value.trim()) {
    const raw = value.trim();
    // Classic EXIF: 2024:03:15 14:30:00
    const exifStyle = raw.replace(
      /^(\d{4}):(\d{2}):(\d{2})([ T])/,
      "$1-$2-$3$4",
    );
    const d = new Date(exifStyle);
    if (!Number.isNaN(d.getTime())) return d;

    const d2 = new Date(raw);
    if (!Number.isNaN(d2.getTime())) return d2;
  }

  return null;
}

function pickDate(data: Record<string, unknown>): Date | null {
  const keys = [
    "DateTimeOriginal",
    "CreateDate",
    "DateTimeDigitized",
    "ModifyDate",
    "DateTime",
  ];
  for (const key of keys) {
    const date = coerceExifDate(data[key]);
    if (date) return date;
  }
  return null;
}

export async function readExifMeta(buffer: ArrayBuffer): Promise<ExifMeta> {
  try {
    // Avoid narrow `pick` — HEIC/iPhone files often need a wider scan for dates.
    const data = (await exifr.parse(buffer, {
      gps: true,
      exif: true,
      ifd0: true,
      reviveValues: true,
      translateKeys: true,
      // HEIC: EXIF may sit later in the file than JPEG
      firstChunkSize: 128 * 1024,
      chunkSize: 64 * 1024,
      chunkLimit: 32,
    })) as Record<string, unknown> | undefined;

    if (!data) {
      return { occurredAt: null, lat: null, lng: null };
    }

    const occurredAt = pickDate(data);
    const lat =
      typeof data.latitude === "number" && Number.isFinite(data.latitude)
        ? data.latitude
        : null;
    const lng =
      typeof data.longitude === "number" && Number.isFinite(data.longitude)
        ? data.longitude
        : null;

    return { occurredAt, lat, lng };
  } catch (err) {
    console.error("readExifMeta failed", err);
    return { occurredAt: null, lat: null, lng: null };
  }
}
