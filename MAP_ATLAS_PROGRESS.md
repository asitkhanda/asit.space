# Map-First Memory Atlas — Progress Report

Updated: 2026-09-23 (next implementation pass)

## Executive summary

The `/lab/map` prototype is a map-first chronological memory surface. This pass hardened the Mapbox-primary path: extracted a pale illustrated atlas style with building extrusions, replaced camera teleports with distance-aware travel, added a dedicated **Unlocated memories** region, and replaced the CSS isometric OSM “fake product” fallback with an honest unavailable panel.

**Mapbox token is still required for the designed look.** `.env.local` does not yet contain a live `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`. Without it the app uses MapLibre/OpenFreeMap when reachable, otherwise shows the unavailable panel while keeping the timeline usable.

## What changed in this pass

### Pale atlas style

- New module: `src/components/map/map-style.ts`
- Renamed/extracted former `FALLBACK_STYLE` → `ATLAS_MAPBOX_STYLE`
- Warmer pale ground, quieter place labels (minzoom 11, city/town filter), clay-toned extrusions
- Phase paint retints background, land, water, parks, roads, buildings, and labels for day → night
- Shared `openFreeMapBuildingColor` for cheap MapLibre parity

### Camera travel

- `src/components/map/map-geography.ts`: `haversineKm`, `greatCircleMidpoint`, `planCameraMotion`, expanded `cameraForTarget`
- Near hops (&lt; ~90 km): `easeTo`
- Far hops: zoom-out → great-circle midpoint → settle
- `jumpTo` only for reduced motion or first frame

### Unlocated region

- Fixed center `UNLOCATED_CENTER` (−28.65, 38.45) with label **Unlocated memories**
- Posts without GPS fly to that region at a distinctive zoom/pitch
- Demo set includes a fifth post without GPS for local testing
- Effects ring/beacon hide when the active memory is unlocated

### Honest unavailable UX

- Removed CSS isometric OSM tile fallback and related dead CSS (`.map-osm-*`, `.map-isometric-*`, `.map-lab-pin`)
- Unavailable state is a calm panel explaining the Mapbox token / OpenFreeMap requirement
- Timeline, phases, weather, and photo card remain usable

## Technology stack

Unchanged core: Next.js 16.3.5, React 19, Mapbox GL JS, MapLibre GL JS, Three.js, GSAP, Supabase, Open-Meteo.

## Architecture

```
scroll progress → phase blend + active MapTarget
                      ↓
              MapProvider (Mapbox token → pale atlas
                           else MapLibre OpenFreeMap
                           else unavailable panel)
                      ↓
              planCameraMotion → easeTo / travel / jump
                      ↓
              MapEffectsLayer (ring, beacon, traces, weather particles)
```

## Verification

Completed:

- `npx tsc --noEmit`
- `npm run lint`
- Code paths for camera travel, unlocated region, style extract, unavailable panel

Not yet visually verified (needs token):

- Mapbox pale style + fill-extrusion buildings on `/lab/map`
- Phase paint on Mapbox layers
- Far-hop travel animation on the real vector map

## How to verify Mapbox locally

1. Create a public token at https://account.mapbox.com/access-tokens/
2. Add to `.env.local`:

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk....
```

3. Restart `npm run dev`
4. Open http://localhost:3000/lab/map
5. Confirm `data-map-provider="mapbox"`, extruded buildings at city zoom, and travel between demo cities (Bangalore → Mumbai → Hampi → Jaipur → unlocated)

## Recommended next steps

1. Add Mapbox token and capture desktop/mobile screenshots of the true vector path.
2. Optional MapLibre style parity with the pale atlas (beyond building tint).
3. Production build + deploy when ready to leave lab.
4. Automated tests for timeline bounds, keyboard, reduced motion, weather failures, missing GPS.

## Working-tree note

Work remains uncommitted by design until you ask to commit. Review `git status` before deciding what lands together.
