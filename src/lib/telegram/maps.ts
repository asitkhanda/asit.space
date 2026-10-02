import { mapsUrlFromCoords } from "@/lib/format";

export type ParsedMapsLocation = {
  lat: number;
  lng: number;
  maps_url: string;
  location_name: string;
};

function isMapsHost(hostname: string) {
  const h = hostname.toLowerCase();
  if (
    h === "maps.app.goo.gl" ||
    h === "goo.gl" ||
    h.endsWith(".goo.gl") ||
    h === "maps.google.com" ||
    h.endsWith(".maps.google.com")
  ) {
    return true;
  }
  // google.com, www.google.com, google.co.in, www.google.co.uk, …
  return (
    h === "google.com" ||
    h.endsWith(".google.com") ||
    /^([a-z0-9-]+\.)*google\.[a-z.]+$/.test(h)
  );
}

function validCoords(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

function pair(
  a: string | undefined,
  b: string | undefined,
): { lat: number; lng: number } | null {
  if (a == null || b == null) return null;
  const lat = Number(a);
  const lng = Number(b);
  if (!validCoords(lat, lng)) return null;
  return { lat, lng };
}

function dmsToDecimal(
  deg: number,
  minutes: number,
  seconds: number,
  hemi?: string,
) {
  let value = Math.abs(deg) + minutes / 60 + seconds / 3600;
  if (hemi && /[SWsw]/.test(hemi)) value = -value;
  else if (!hemi && deg < 0) value = -value;
  return value;
}

/**
 * Parse pasted coordinates:
 * - decimal: 12.9731, 77.6073
 * - DMS: 12°59'24.0"N 77°43'46.2"E
 */
export function parseCoords(text: string): { lat: number; lng: number } | null {
  const raw = text.trim().replace(/\u00a0/g, " ");

  const decimal = raw.match(
    /^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/,
  );
  if (decimal) return pair(decimal[1], decimal[2]);

  // 12°59'24.0"N 77°43'46.2"E (also unicode ′ ″)
  const dms = raw.match(
    /^(\d{1,3})\s*[°º]\s*(\d{1,2})\s*['′]\s*(\d{1,2}(?:\.\d+)?)\s*["″]?\s*([NSns])\s*[, ]\s*(\d{1,3})\s*[°º]\s*(\d{1,2})\s*['′]\s*(\d{1,2}(?:\.\d+)?)\s*["″]?\s*([EWew])$/,
  );
  if (dms) {
    const lat = dmsToDecimal(
      Number(dms[1]),
      Number(dms[2]),
      Number(dms[3]),
      dms[4],
    );
    const lng = dmsToDecimal(
      Number(dms[5]),
      Number(dms[6]),
      Number(dms[7]),
      dms[8],
    );
    if (validCoords(lat, lng)) return { lat, lng };
  }

  return null;
}

/**
 * Extract lat,lng from common Google Maps URL shapes.
 * Prefer the place pin (!3d/!4d) over the viewport center (@lat,lng).
 */
export function coordsFromMapsUrl(url: string): { lat: number; lng: number } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const href = parsed.href;

  // Place pin inside data=…!8m2!3dLAT!4dLNG (most accurate)
  const pin8 = href.match(/!8m2!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  const from8 = pair(pin8?.[1], pin8?.[2]);
  if (from8) return from8;

  // Any !3dLAT!4dLNG marker (still the pin, not the camera)
  const bang = href.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  const fromBang = pair(bang?.[1], bang?.[2]);
  if (fromBang) return fromBang;

  const q = parsed.searchParams.get("q") ?? parsed.searchParams.get("query");
  if (q) {
    const m = q.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
    const fromQ = pair(m?.[1], m?.[2]);
    if (fromQ) return fromQ;
  }

  const ll = parsed.searchParams.get("ll");
  if (ll) {
    const m = ll.match(/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    const fromLl = pair(m?.[1], m?.[2]);
    if (fromLl) return fromLl;
  }

  // /maps/search/lat,+lng  or  /maps/place/lat,lng
  const search = parsed.pathname.match(
    /\/maps\/(?:search|place)\/(-?\d+\.?\d*),?\+?(-?\d+\.?\d*)/,
  );
  const fromSearch = pair(search?.[1], search?.[2]);
  if (fromSearch) return fromSearch;

  // /@lat,lng,zoom — viewport/camera center only (last resort)
  const at = parsed.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  const fromAt = pair(at?.[1], at?.[2]);
  if (fromAt) return fromAt;

  return null;
}

function placeNameFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const place = parsed.pathname.match(/\/maps\/place\/([^/]+)/);
    if (place?.[1]) {
      const raw = decodeURIComponent(place[1].replace(/\+/g, " "));
      // Skip pure coordinate place paths
      if (!/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(raw)) return raw;
    }
    const q = parsed.searchParams.get("q") ?? parsed.searchParams.get("query");
    if (q && !/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(q.trim())) {
      return q.trim();
    }
  } catch {
    /* ignore */
  }
  return null;
}

function stripTrailingJunk(href: string) {
  return href.replace(/[),\]]+$/g, "");
}

function coordsFromHtml(html: string): { lat: number; lng: number } | null {
  const pin8 = html.match(/!8m2!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  const from8 = pair(pin8?.[1], pin8?.[2]);
  if (from8) return from8;

  const bang = html.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  const fromBang = pair(bang?.[1], bang?.[2]);
  if (fromBang) return fromBang;

  const at = html.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const fromAt = pair(at?.[1], at?.[2]);
  if (fromAt) return fromAt;

  return null;
}

/**
 * Follow short-link redirects; Cloudflare/Google may need a few hops.
 * Returns the final URL after redirects (or the original on failure),
 * plus any coordinates scraped from redirect HTML.
 */
async function resolveMapsUrl(
  href: string,
): Promise<{ url: string; coords: { lat: number; lng: number } | null }> {
  let current = href;
  let coords: { lat: number; lng: number } | null = null;

  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(current, {
        method: "GET",
        redirect: "manual",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; asit.space-bot/1.0; +https://asit.space)",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      const loc = res.headers.get("location");
      if (
        loc &&
        (res.status === 301 ||
          res.status === 302 ||
          res.status === 303 ||
          res.status === 307 ||
          res.status === 308)
      ) {
        current = new URL(loc, current).href;
        coords = coordsFromMapsUrl(current) ?? coords;
        continue;
      }

      // Follow mode may already be final
      if (res.url && res.url !== current) {
        current = res.url;
        coords = coordsFromMapsUrl(current) ?? coords;
      }

      // Meta-refresh / canonical in HTML when Location header is missing
      if (res.ok) {
        const html = await res.text();
        coords = coordsFromHtml(html) ?? coords;

        const canonical = html.match(
          /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
        );
        if (canonical?.[1]?.includes("google.") && canonical[1].includes("/maps")) {
          current = canonical[1];
          coords = coordsFromMapsUrl(current) ?? coords;
          return { url: current, coords };
        }
        const og = html.match(
          /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i,
        );
        if (og?.[1]?.includes("google.") && og[1].includes("/maps")) {
          current = og[1];
          coords = coordsFromMapsUrl(current) ?? coords;
          return { url: current, coords };
        }
        const embedded = html.match(
          /https:\/\/(?:www\.)?google\.[^"'/\s]+\/maps\/[^"'\s<>]+/i,
        );
        if (embedded?.[0]) {
          current = embedded[0].replace(/&amp;/g, "&");
          coords = coordsFromMapsUrl(current) ?? coords;
          return { url: current, coords };
        }
      }

      return { url: current, coords };
    } catch {
      break;
    }
  }

  // Last attempt: let the runtime follow redirects
  try {
    const res = await fetch(href, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; asit.space-bot/1.0; +https://asit.space)",
      },
    });
    const finalUrl = res.url || current;
    coords = coordsFromMapsUrl(finalUrl) ?? coords;
    if (res.ok) {
      const html = await res.text();
      coords = coordsFromHtml(html) ?? coords;
    }
    return { url: finalUrl, coords };
  } catch {
    return { url: current, coords };
  }
}

function geocodeCandidates(name: string): string[] {
  // "&" and long "Hotel & Convention Center" tails often miss in Nominatim
  const cleaned = name
    .replace(/\s+/g, " ")
    .replace(/&/g, "and")
    .trim();
  if (!cleaned) return [];

  const beforeComma = cleaned.split(",")[0]?.trim() ?? cleaned;
  const words = beforeComma.split(/\s+/).filter(Boolean);

  return [
    words.slice(0, 4).join(" "),
    words.slice(0, 5).join(" "),
    beforeComma,
    cleaned.split(",").slice(0, 2).join(",").trim(),
    words.slice(0, 3).join(" "),
    cleaned,
  ].filter((q, i, arr) => q.length >= 4 && arr.indexOf(q) === i);
}

/** Geocode a place-name Maps share (q=Hotel Name) via OpenStreetMap. */
async function geocodePlaceName(
  name: string,
): Promise<{ lat: number; lng: number } | null> {
  for (const q of geocodeCandidates(name)) {
    try {
      const url =
        "https://nominatim.openstreetmap.org/search?" +
        new URLSearchParams({
          format: "json",
          limit: "1",
          q,
        });
      const res = await fetch(url, {
        headers: {
          "User-Agent": "asit.space-bot/1.0 (+https://asit.space)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
      const hit = data[0];
      const coords = pair(hit?.lat, hit?.lon);
      if (coords) return coords;
    } catch {
      /* try next candidate */
    }
  }

  return null;
}

/**
 * Resolve a Google Maps link (including short links) to coordinates.
 * Keeps the resolved Maps URL so the site link matches what you shared.
 * Place-name shares (q=Hotel…) with no embedded lat/lng are geocoded.
 */
export async function parseMapsLink(
  text: string,
): Promise<ParsedMapsLocation | null> {
  const match = text.match(/https?:\/\/\S+/i);
  if (!match) return null;

  const href = stripTrailingJunk(match[0]);
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }

  if (!isMapsHost(url.hostname)) return null;

  let finalUrl = href;
  let coords = coordsFromMapsUrl(href);

  const needsResolve =
    !coords ||
    url.hostname.includes("goo.gl") ||
    url.hostname === "maps.app.goo.gl";

  if (needsResolve) {
    const resolved = await resolveMapsUrl(href);
    finalUrl = resolved.url;
    coords = resolved.coords ?? coordsFromMapsUrl(finalUrl) ?? coords;
  }

  const name =
    placeNameFromUrl(finalUrl) ??
    placeNameFromUrl(href) ??
    null;

  // iPhone/Android place shares often only have q=Name (+ ftid), never lat/lng
  if (!coords && name) {
    coords = await geocodePlaceName(name);
  }

  if (!coords) return null;

  const location_name =
    name ?? `Pin ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;

  // Prefer the real Maps URL (place page / short link) over a rebuilt ?q=lat,lng
  // so the chip opens the same pin the publisher shared.
  let maps_url = finalUrl;
  try {
    const u = new URL(finalUrl);
    if (!isMapsHost(u.hostname)) {
      maps_url = mapsUrlFromCoords(coords.lat, coords.lng);
    }
  } catch {
    maps_url = mapsUrlFromCoords(coords.lat, coords.lng);
  }

  return {
    lat: coords.lat,
    lng: coords.lng,
    maps_url,
    location_name,
  };
}

export function locationFromTelegram(
  lat: number,
  lng: number,
  title?: string,
): ParsedMapsLocation {
  return {
    lat,
    lng,
    maps_url: mapsUrlFromCoords(lat, lng),
    location_name:
      title?.trim() ||
      `Pin ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
  };
}

/** Build a location from pasted decimal/DMS coordinates. */
export function locationFromCoordsText(
  text: string,
): ParsedMapsLocation | null {
  const coords = parseCoords(text);
  if (!coords) return null;
  return locationFromTelegram(coords.lat, coords.lng);
}
