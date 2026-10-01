import type { StyleSpecification } from "mapbox-gl";
import type { PhaseLook } from "@/lib/map-phases";

/** Active pin fill — soft paper on graphite. */
export const PIN_SPOTLIGHT = "#f2ebe3";

/** Area glow under the active pin — coral so it reads on graphite. */
export const PIN_GLOW = "#ff5a45";

type GlowFeature = {
  type: "Feature";
  properties: { opacity: number; ring: number };
  geometry: { type: "Polygon"; coordinates: [number, number][][] };
};

const EMPTY_GLOW = {
  type: "FeatureCollection" as const,
  features: [] as GlowFeature[],
};

const pinGlowSource = {
  type: "geojson" as const,
  data: EMPTY_GLOW,
};

/** Soft radial bands (metres) — annular rings so opacity does not stack harshly. */
const GLOW_BANDS: Array<{ inner: number; outer: number; opacity: number }> = [
  { inner: 0, outer: 12, opacity: 0.52 },
  { inner: 12, outer: 24, opacity: 0.36 },
  { inner: 24, outer: 40, opacity: 0.24 },
  { inner: 40, outer: 60, opacity: 0.14 },
  { inner: 60, outer: 85, opacity: 0.07 },
  { inner: 85, outer: 115, opacity: 0.03 },
];

/** Approximate circle polygon in metres around a lon/lat (CCW exterior). */
function circleRing(
  lng: number,
  lat: number,
  radiusMeters: number,
  steps = 72,
  clockwise = false,
): [number, number][] {
  const coords: [number, number][] = [];
  const latRad = (lat * Math.PI) / 180;
  const metersPerDegLat = 110540;
  const metersPerDegLng = 111320 * Math.cos(latRad);
  for (let i = 0; i <= steps; i++) {
    const t = clockwise ? steps - i : i;
    const angle = (t / steps) * Math.PI * 2;
    const dLat = (radiusMeters * Math.sin(angle)) / metersPerDegLat;
    const dLng = (radiusMeters * Math.cos(angle)) / metersPerDegLng;
    coords.push([lng + dLng, lat + dLat]);
  }
  return coords;
}

function glowCollection(lng: number, lat: number): typeof EMPTY_GLOW {
  return {
    type: "FeatureCollection",
    features: GLOW_BANDS.map((band, ring) => {
      const outer = circleRing(lng, lat, band.outer, 72, false);
      const coordinates: [number, number][][] =
        band.inner <= 0
          ? [outer]
          : [outer, circleRing(lng, lat, band.inner, 72, true)];
      return {
        type: "Feature" as const,
        properties: { opacity: band.opacity, ring },
        geometry: { type: "Polygon" as const, coordinates },
      };
    }),
  };
}

/** Ground-plane glow — inserted under buildings so extrusions sit in the light. */
const pinGlowLayer = {
  id: "pin-glow",
  type: "fill" as const,
  source: "pin-glow",
  paint: {
    "fill-color": PIN_GLOW,
    "fill-opacity": ["get", "opacity"] as unknown as number,
    "fill-antialias": true,
  },
};

/**
 * Cool graphite monochrome atlas for Mapbox Streets v8.
 * No text labels. Spotlight disc lives in the pin-glow source.
 */
export const ATLAS_MAPBOX_STYLE = {
  version: 8 as const,
  name: "asit-memory-atlas",
  sources: {
    streets: {
      type: "vector" as const,
      url: "mapbox://mapbox.mapbox-streets-v8",
    },
    "pin-glow": pinGlowSource,
  },
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  layers: [
    {
      id: "background",
      type: "background" as const,
      paint: { "background-color": "#e8e8ea" },
    },
    {
      id: "land",
      type: "fill" as const,
      source: "streets",
      "source-layer": "landuse",
      filter: [
        "in",
        "class",
        "residential",
        "commercial",
        "industrial",
        "hospital",
        "school",
        "university",
      ],
      paint: {
        "fill-color": "#d8d8dc",
        "fill-opacity": 0.72,
      },
    },
    {
      id: "parks",
      type: "fill" as const,
      source: "streets",
      "source-layer": "landuse",
      filter: [
        "in",
        "class",
        "park",
        "grass",
        "garden",
        "cemetery",
        "pitch",
        "wood",
        "scrub",
      ],
      paint: {
        "fill-color": "#c4c4c8",
        "fill-opacity": 0.92,
      },
    },
    {
      id: "water",
      type: "fill" as const,
      source: "streets",
      "source-layer": "water",
      paint: {
        "fill-color": "#b0b0b6",
        "fill-opacity": 0.95,
      },
    },
    {
      id: "waterway",
      type: "line" as const,
      source: "streets",
      "source-layer": "waterway",
      paint: {
        "line-color": "#a4a4aa",
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          0.5,
          16,
          2.6,
        ],
      },
    },
    {
      id: "roads-casing",
      type: "line" as const,
      source: "streets",
      "source-layer": "road",
      minzoom: 9,
      paint: {
        "line-color": "#f7f7f9",
        "line-opacity": 0.45,
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          9,
          0.6,
          16,
          4.5,
        ],
      },
    },
    {
      id: "roads",
      type: "line" as const,
      source: "streets",
      "source-layer": "road",
      minzoom: 9,
      paint: {
        "line-color": "#ececef",
        "line-opacity": 0.55,
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          9,
          0.25,
          16,
          2.2,
        ],
      },
    },
    pinGlowLayer,
    {
      id: "buildings",
      type: "fill-extrusion" as const,
      source: "streets",
      "source-layer": "building",
      minzoom: 13,
      paint: {
        "fill-extrusion-color": "#ceced2",
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          13,
          0,
          15.5,
          ["coalesce", ["get", "height"], 12],
        ],
        "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
        "fill-extrusion-opacity": 0.96,
      },
    },
  ],
} as unknown as StyleSpecification;

/**
 * Same graphite atlas on free OpenMapTiles via OpenFreeMap.
 * Layer ids match ATLAS_MAPBOX_STYLE so applyAtlasPhase works for both.
 */
export const ATLAS_OPENFREEMAP_STYLE = {
  version: 8 as const,
  name: "asit-memory-atlas-ofm",
  sources: {
    openmaptiles: {
      type: "vector" as const,
      url: "https://tiles.openfreemap.org/planet",
      maxzoom: 14,
    },
    "pin-glow": pinGlowSource,
  },
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  layers: [
    {
      id: "background",
      type: "background" as const,
      paint: { "background-color": "#e8e8ea" },
    },
    {
      id: "land",
      type: "fill" as const,
      source: "openmaptiles",
      "source-layer": "landuse",
      filter: [
        "in",
        "class",
        "residential",
        "commercial",
        "industrial",
        "hospital",
        "school",
        "university",
      ],
      paint: {
        "fill-color": "#d8d8dc",
        "fill-opacity": 0.72,
      },
    },
    {
      id: "parks",
      type: "fill" as const,
      source: "openmaptiles",
      "source-layer": "landuse",
      filter: [
        "in",
        "class",
        "park",
        "grass",
        "cemetery",
        "pitch",
        "forest",
        "wood",
        "scrub",
      ],
      paint: {
        "fill-color": "#c4c4c8",
        "fill-opacity": 0.92,
      },
    },
    {
      id: "water",
      type: "fill" as const,
      source: "openmaptiles",
      "source-layer": "water",
      paint: {
        "fill-color": "#b0b0b6",
        "fill-opacity": 0.95,
      },
    },
    {
      id: "waterway",
      type: "line" as const,
      source: "openmaptiles",
      "source-layer": "waterway",
      paint: {
        "line-color": "#a4a4aa",
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          0.5,
          16,
          2.6,
        ],
      },
    },
    {
      id: "roads-casing",
      type: "line" as const,
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 9,
      filter: ["!=", ["get", "brunnel"], "tunnel"],
      paint: {
        "line-color": "#f7f7f9",
        "line-opacity": 0.45,
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          9,
          0.6,
          16,
          4.5,
        ],
      },
    },
    {
      id: "roads",
      type: "line" as const,
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 9,
      filter: ["!=", ["get", "brunnel"], "tunnel"],
      paint: {
        "line-color": "#ececef",
        "line-opacity": 0.55,
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          9,
          0.25,
          16,
          2.2,
        ],
      },
    },
    pinGlowLayer,
    {
      id: "buildings",
      type: "fill-extrusion" as const,
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 12,
      paint: {
        "fill-extrusion-color": "#ceced2",
        "fill-extrusion-height": [
          "*",
          3.2,
          [
            "max",
            12,
            [
              "coalesce",
              ["get", "render_height"],
              ["get", "height"],
              12,
            ],
          ],
        ],
        "fill-extrusion-base": [
          "coalesce",
          ["get", "render_min_height"],
          ["get", "min_height"],
          0,
        ],
        "fill-extrusion-opacity": 0.94,
        "fill-extrusion-vertical-gradient": true,
      },
    },
  ],
} as unknown as StyleSpecification;

export function phasePaintValues(phase: PhaseLook): Array<[string, string, string]> {
  const night = phase.id === "night";
  const evening = phase.id === "evening";
  const afternoon = phase.id === "afternoon";

  return [
    ["background", "background-color", phase.sky],
    [
      "land",
      "fill-color",
      night ? "#2a2a2e" : evening ? "#3a3a40" : afternoon ? "#d0d0d4" : "#d8d8dc",
    ],
    [
      "water",
      "fill-color",
      night ? "#1c1c22" : evening ? "#2e2e36" : afternoon ? "#a8a8ae" : "#b0b0b6",
    ],
    [
      "parks",
      "fill-color",
      night ? "#26262c" : evening ? "#36363c" : afternoon ? "#bcbcc0" : "#c4c4c8",
    ],
    [
      "roads",
      "line-color",
      night ? "#3a3a40" : evening ? "#4a4a52" : afternoon ? "#e6e6ea" : "#ececef",
    ],
    [
      "roads-casing",
      "line-color",
      night ? "#2e2e34" : evening ? "#3e3e46" : afternoon ? "#f2f2f5" : "#f7f7f9",
    ],
    [
      "buildings",
      "fill-extrusion-color",
      night ? "#34343a" : evening ? "#484850" : afternoon ? "#c6c6ca" : "#ceced2",
    ],
    [
      "waterway",
      "line-color",
      night ? "#2a2a30" : evening ? "#3c3c44" : afternoon ? "#9c9ca2" : "#a4a4aa",
    ],
  ];
}

export function applyAtlasPhase(
  map: import("mapbox-gl").Map,
  phase: PhaseLook,
) {
  for (const [layer, property, value] of phasePaintValues(phase)) {
    if (map.getLayer(layer)) {
      map.setPaintProperty(
        layer,
        property as Parameters<import("mapbox-gl").Map["setPaintProperty"]>[1],
        value,
      );
    }
  }
}

export function setPinGlow(
  map: import("mapbox-gl").Map,
  lng: number | null,
  lat: number | null,
  located: boolean,
  pulse = true,
) {
  const source = map.getSource("pin-glow") as
    | { setData: (data: typeof EMPTY_GLOW) => void }
    | undefined;
  if (!source) return;

  if (!located || lng == null || lat == null) {
    stopPinGlowPulse();
    source.setData(EMPTY_GLOW);
    return;
  }

  source.setData(glowCollection(lng, lat));

  if (pulse) {
    startPinGlowPulse(map);
  } else {
    stopPinGlowPulse();
    if (map.getLayer("pin-glow")) {
      map.setPaintProperty(
        "pin-glow",
        "fill-opacity",
        ["get", "opacity"] as unknown as number,
      );
    }
  }
}

let glowPulseRaf = 0;
let glowPulseMap: import("mapbox-gl").Map | null = null;

function stopPinGlowPulse() {
  if (glowPulseRaf) cancelAnimationFrame(glowPulseRaf);
  glowPulseRaf = 0;
  glowPulseMap = null;
}

/** Breathe the fill opacity so the ground glow reads as a live beacon. */
function startPinGlowPulse(map: import("mapbox-gl").Map) {
  if (glowPulseMap === map && glowPulseRaf) return;

  stopPinGlowPulse();
  glowPulseMap = map;
  const t0 = performance.now();

  const tick = (now: number) => {
    if (glowPulseMap !== map || !map.getLayer("pin-glow")) {
      glowPulseRaf = 0;
      glowPulseMap = null;
      return;
    }

    // ~2.4s cycle — soft in/out, never fully gone
    const wave = 0.5 + 0.5 * Math.sin(((now - t0) / 2400) * Math.PI * 2);
    const factor = 0.55 + wave * 0.7;
    map.setPaintProperty("pin-glow", "fill-opacity", [
      "*",
      ["get", "opacity"],
      factor,
    ] as unknown as number);

    glowPulseRaf = requestAnimationFrame(tick);
  };

  glowPulseRaf = requestAnimationFrame(tick);
}

/** Shared tint for MapLibre OpenFreeMap buildings (cheap parity). */
export function openFreeMapBuildingColor(phase: PhaseLook): string {
  if (phase.id === "night") return "#34343a";
  if (phase.id === "evening") return "#484850";
  if (phase.id === "afternoon") return "#c6c6ca";
  return "#ceced2";
}
