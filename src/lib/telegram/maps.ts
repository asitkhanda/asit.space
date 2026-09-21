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

/**
 * Follow short-link redirects; Cloudflare/Google may need a few hops.
 * Returns the final URL after redirects (or the original on failure).
 */
async function resolveMapsUrl(href: string): Promise<string> {
  let current = href;
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
        continue;
      }

      // Follow mode may already be final
      if (res.url && res.url !== current) {
        current = res.url;
      }

      // Meta-refresh / canonical in HTML when Location header is missing
      if (res.ok) {
        const html = await res.text();
        const canonical = html.match(
          /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
        );
        if (canonical?.[1]?.includes("google.") && canonical[1].includes("/maps")) {
          return canonical[1];
        }
        const og = html.match(
          /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i,
        );
        if (og?.[1]?.includes("google.") && og[1].includes("/maps")) {
          return og[1];
        }
        const embedded = html.match(
          /https:\/\/(?:www\.)?google\.[^"'/\s]+\/maps\/[^"'\s<>]+/i,
        );
        if (embedded?.[0]) {
          return embedded[0].replace(/&amp;/g, "&");
        }
      }

      return current;
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
    return res.url || current;
  } catch {
    return current;
  }
}

/**
 * Resolve a Google Maps link (including short links) to coordinates.
 * Keeps the resolved Maps URL so the site link matches what you shared.
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
    finalUrl = await resolveMapsUrl(href);
    coords = coordsFromMapsUrl(finalUrl) ?? coords;
  }

  if (!coords) return null;

  const name =
    placeNameFromUrl(finalUrl) ??
    placeNameFromUrl(href) ??
    `Pin ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;

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
    location_name: name,
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
