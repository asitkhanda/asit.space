import { mapsUrlFromCoords } from "@/lib/format";
import { parseMomentDate } from "@/lib/telegram/date";
import { parseMapsLink } from "@/lib/telegram/maps";
import { parsePeopleLines, type PersonInput } from "@/lib/telegram/people";

export type CaptionParse = {
  date: Date | null;
  lat: number | null;
  lng: number | null;
  maps_url: string | null;
  location_name: string | null;
  people: PersonInput[];
};

export const CAPTION_FORMAT = `Caption format (all in the photo caption):

Line 1 — date
18 Sep 2024
or 2024-09-18
or 18 Sep 2024 19:30

Line 2 — maps link or lat,lng | place name
https://maps.app.goo.gl/... | Cubbon Park
or 12.9731, 77.6073 | Cubbon Park

Line 3+ — people (optional)
Alice | @alice
Bob | https://linkedin.com/in/bob

If the caption is complete, the bot publishes with no extra questions.
Telegram location pins can’t go in a caption — use a Maps link or coordinates.`;

function parseCoords(text: string): { lat: number; lng: number } | null {
  const m = text
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

/**
 * Standard caption:
 * 1) date
 * 2) mapsUrl|name  OR  lat,lng|name  OR  name (coords from EXIF)
 * 3+) people lines
 */
export async function parsePublishCaption(
  caption: string,
  fallbacks: {
    date: Date | null;
    lat: number | null;
    lng: number | null;
  },
): Promise<CaptionParse> {
  const lines = caption
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let date: Date | null = fallbacks.date;
  let lat = fallbacks.lat;
  let lng = fallbacks.lng;
  let maps_url: string | null =
    lat != null && lng != null ? mapsUrlFromCoords(lat, lng) : null;
  let location_name: string | null = null;
  let people: PersonInput[] = [];

  if (!lines.length) {
    return { date, lat, lng, maps_url, location_name, people };
  }

  // Line 1 — date (if it parses as a date; otherwise treat as location line)
  let rest = lines;
  const maybeDate = parseMomentDate(lines[0], fallbacks.date ?? new Date());
  if (maybeDate) {
    date = maybeDate;
    rest = lines.slice(1);
  }

  if (rest.length) {
    const locLine = rest[0];
    const pipe = locLine.indexOf("|");
    if (pipe >= 0) {
      const left = locLine.slice(0, pipe).trim();
      const right = locLine.slice(pipe + 1).trim();
      location_name = right || null;

      const coords = parseCoords(left);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        maps_url = mapsUrlFromCoords(lat, lng);
      } else {
        const mapped = await parseMapsLink(left);
        if (mapped) {
          lat = mapped.lat;
          lng = mapped.lng;
          maps_url = mapped.maps_url;
          if (!location_name) location_name = mapped.location_name;
        } else if (left && !location_name) {
          // "Name | @handle" mistaken? If right looks like social, this is people — handled below
          location_name = left;
        }
      }
      rest = rest.slice(1);
    } else {
      const coords = parseCoords(locLine);
      const mapped = await parseMapsLink(locLine);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        maps_url = mapsUrlFromCoords(lat, lng);
        rest = rest.slice(1);
      } else if (mapped) {
        lat = mapped.lat;
        lng = mapped.lng;
        maps_url = mapped.maps_url;
        location_name = mapped.location_name;
        rest = rest.slice(1);
      } else {
        location_name = locLine;
        rest = rest.slice(1);
      }
    }
  }

  if (rest.length) {
    people = parsePeopleLines(rest.join("\n"));
  }

  return { date, lat, lng, maps_url, location_name, people };
}

export function captionIsComplete(parsed: CaptionParse): boolean {
  return Boolean(
    parsed.date &&
      parsed.location_name?.trim() &&
      parsed.lat != null &&
      parsed.lng != null,
  );
}
