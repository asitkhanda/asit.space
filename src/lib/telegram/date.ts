/**
 * Parse a human date (and optional time) into a Date.
 * Accepts: 2024-03-15, 15 Mar 2024, 18 SEP 2026, 2024-03-15 14:30, etc.
 */
export function parseMomentDate(
  text: string,
  fallbackTime?: Date,
): Date | null {
  const raw = text.trim();
  if (!raw) return null;

  // ISO-ish: 2024-03-15 or 2024-03-15 14:30 or 2024-03-15T14:30
  const iso = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]) - 1;
    const d = Number(iso[3]);
    const hh = iso[4] != null ? Number(iso[4]) : (fallbackTime?.getHours() ?? 12);
    const mm = iso[5] != null ? Number(iso[5]) : (fallbackTime?.getMinutes() ?? 0);
    const ss = iso[6] != null ? Number(iso[6]) : 0;
    const date = new Date(y, m, d, hh, mm, ss);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // 15 Mar 2024 / 18 SEP 2026 / 15 March 2024 optional time
  const human = raw.match(
    /^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/,
  );
  if (human) {
    const months: Record<string, number> = {
      jan: 0,
      january: 0,
      feb: 1,
      february: 1,
      mar: 2,
      march: 2,
      apr: 3,
      april: 3,
      may: 4,
      jun: 5,
      june: 5,
      jul: 6,
      july: 6,
      aug: 7,
      august: 7,
      sep: 8,
      sept: 8,
      september: 8,
      oct: 9,
      october: 9,
      nov: 10,
      november: 10,
      dec: 11,
      december: 11,
    };
    const month = months[human[2].toLowerCase()];
    if (month == null) return null;
    const d = Number(human[1]);
    const y = Number(human[3]);
    const hh =
      human[4] != null ? Number(human[4]) : (fallbackTime?.getHours() ?? 12);
    const mm =
      human[5] != null ? Number(human[5]) : (fallbackTime?.getMinutes() ?? 0);
    const date = new Date(y, month, d, hh, mm, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Last resort: Date.parse
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  return null;
}
