import { mapsUrlFromCoords } from "@/lib/format";

export type ParsedMapsLocation = {
  lat: number;
  lng: number;
  maps_url: string;
  location_name: string;
};

const MAPS_HOSTS = [
  "google.com",
  "www.google.com",
  "maps.google.com",
  "maps.app.goo.gl",
  "goo.gl",
];

function isMapsHost(hostname: string) {
  const h = hostname.toLowerCase();
  return MAPS_HOSTS.some((host) => h === host || h.endsWith(`.${host}`));
}

/** Extract lat,lng from common Google Maps URL shapes. */
export function coordsFromMapsUrl(url: string): { lat: number; lng: number } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const q = parsed.searchParams.get("q") ?? parsed.searchParams.get("query");
  if (q) {
    const m = q.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }

  const ll = parsed.searchParams.get("ll");
  if (ll) {
    const m = ll.match(/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }

  // /@lat,lng,zoom or /place/.../@lat,lng
  const at = parsed.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (at) {
    const lat = Number(at[1]);
    const lng = Number(at[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  // /maps/search/lat,+lng
  const search = parsed.pathname.match(
    /\/maps\/search\/(-?\d+\.?\d*),?\+?(-?\d+\.?\d*)/,
  );
  if (search) {
    const lat = Number(search[1]);
    const lng = Number(search[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  // !3dLAT!4dLNG
  const bang = parsed.href.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (bang) {
    const lat = Number(bang[1]);
    const lng = Number(bang[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  return null;
}

function placeNameFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const place = parsed.pathname.match(/\/maps\/place\/([^/]+)/);
    if (place?.[1]) {
      return decodeURIComponent(place[1].replace(/\+/g, " "));
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Resolve a Google Maps link (including short links) to coordinates.
 * Follows one redirect hop for goo.gl / maps.app.goo.gl.
 */
export async function parseMapsLink(
  text: string,
): Promise<ParsedMapsLocation | null> {
  const match = text.match(/https?:\/\/\S+/i);
  if (!match) return null;

  let href = match[0].replace(/[),.]+$/, "");
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }

  if (!isMapsHost(url.hostname)) return null;

  let coords = coordsFromMapsUrl(href);
  let finalUrl = href;

  if (!coords && (url.hostname.includes("goo.gl") || url.hostname === "maps.app.goo.gl")) {
    try {
      const res = await fetch(href, {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": "asit.space-bot/1.0" },
      });
      finalUrl = res.url || href;
      coords = coordsFromMapsUrl(finalUrl);
    } catch {
      return null;
    }
  }

  if (!coords) return null;

  const name =
    placeNameFromUrl(finalUrl) ??
    `Pin ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;

  return {
    lat: coords.lat,
    lng: coords.lng,
    maps_url: mapsUrlFromCoords(coords.lat, coords.lng),
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
