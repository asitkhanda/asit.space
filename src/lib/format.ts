export function formatPostDate(iso: string) {
  const date = new Date(iso);
  const day = date.getDate().toString().padStart(2, "0");
  const month = date
    .toLocaleString("en-US", { month: "short" })
    .toUpperCase();
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatArchiveMonth(year: number, month: number) {
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function photoPublicUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("/")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/photos/${path}`;
}

export function mapsUrlFromCoords(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function twitterUrl(handle: string) {
  const clean = handle.replace(/^@/, "");
  return `https://x.com/${clean}`;
}
