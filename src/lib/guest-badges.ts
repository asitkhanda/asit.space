/**
 * Special-day guest postcard badges.
 * Derived from entry created_at — printed QR tokens stay unchanged.
 */

export type GuestBadgeId = "designup-2026";

export type GuestBadge = {
  id: GuestBadgeId;
  label: string;
  /** Inclusive calendar dates in Asia/Kolkata (YYYY-MM-DD). */
  dates: readonly string[];
};

export const GUEST_BADGES: readonly GuestBadge[] = [
  {
    id: "designup-2026",
    label: "DesignUp 2026",
    dates: ["2026-10-02", "2026-10-03", "2026-10-04"],
  },
] as const;

const KOLKATA_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Calendar day in Bengaluru for an ISO timestamp. */
export function kolkataDateKey(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return KOLKATA_DATE.format(date); // en-CA → YYYY-MM-DD
}

export function badgeForCreatedAt(iso: string): GuestBadge | null {
  const key = kolkataDateKey(iso);
  if (!key) return null;
  return GUEST_BADGES.find((badge) => badge.dates.includes(key)) ?? null;
}
