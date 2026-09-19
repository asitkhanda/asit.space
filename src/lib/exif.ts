import exifr from "exifr";

export type ExifMeta = {
  occurredAt: Date | null;
  lat: number | null;
  lng: number | null;
};

export async function readExifMeta(buffer: ArrayBuffer): Promise<ExifMeta> {
  try {
    const data = await exifr.parse(buffer, {
      pick: ["DateTimeOriginal", "CreateDate", "latitude", "longitude"],
      gps: true,
    });
    if (!data) {
      return { occurredAt: null, lat: null, lng: null };
    }

    const rawDate = data.DateTimeOriginal ?? data.CreateDate ?? null;
    let occurredAt: Date | null = null;
    if (rawDate instanceof Date && !Number.isNaN(rawDate.getTime())) {
      occurredAt = rawDate;
    }

    const lat =
      typeof data.latitude === "number" && Number.isFinite(data.latitude)
        ? data.latitude
        : null;
    const lng =
      typeof data.longitude === "number" && Number.isFinite(data.longitude)
        ? data.longitude
        : null;

    return { occurredAt, lat, lng };
  } catch {
    return { occurredAt: null, lat: null, lng: null };
  }
}
