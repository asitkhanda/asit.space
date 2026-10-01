"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { PhaseLook } from "@/lib/map-phases";
import type { PostWithPeople } from "@/lib/types";
import { MapMemoryMarkers } from "./MapMemoryMarkers";
import {
  cameraForTarget,
  planCameraMotion,
  type CameraTarget,
  type MapTarget,
  UNLOCATED_CENTER,
  UNLOCATED_LABEL,
} from "./map-geography";
import {
  ATLAS_MAPBOX_STYLE,
  ATLAS_OPENFREEMAP_STYLE,
  applyAtlasPhase,
  setPinGlow,
} from "./map-style";

type Props = {
  active: MapTarget;
  traces: MapTarget[];
  focused: PostWithPeople;
  usingDemo: boolean;
  darkInk: boolean;
  phase: PhaseLook;
  weatherCode: number | null;
  reducedMotion: boolean;
  onStatusChange: (status: "loading" | "ready" | "unavailable") => void;
};

type AtlasMode = "mapbox" | "openfreemap";

function MapUnavailablePanel({ unlocated }: { unlocated: boolean }) {
  return (
    <div
      className="map-unavailable absolute inset-0 z-0 flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="map-unavailable-card max-w-sm px-6 py-5 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] opacity-60">
          Map unavailable
        </p>
        <p className="mt-3 text-sm leading-relaxed opacity-80">
          Map tiles didn’t load. Check the network and refresh.
        </p>
        {unlocated ? (
          <p className="mt-3 text-xs opacity-55">{UNLOCATED_LABEL}</p>
        ) : null}
      </div>
    </div>
  );
}

function applyCamera(
  map: import("mapbox-gl").Map,
  camera: CameraTarget,
  mode: "jump" | "ease",
  duration?: number,
  options?: { maxZoom: number; clampAtlas: boolean },
) {
  const maxZoom = options?.maxZoom ?? 22;
  const clampAtlas = options?.clampAtlas ?? false;
  // OpenFreeMap planet tiles top out at z14 — empty PBFs past that.
  const next = clampAtlas
    ? {
        ...camera,
        pitch: Math.max(camera.pitch, 52),
        zoom: Math.min(Math.max(camera.zoom, 13.2), maxZoom),
      }
    : {
        ...camera,
        zoom: Math.min(camera.zoom, maxZoom),
      };
  if (mode === "jump") {
    map.jumpTo(next);
    return;
  }
  map.easeTo({
    ...next,
    duration: duration ?? 1200,
    easing: (t) => 1 - Math.pow(1 - t, 3),
    essential: true,
  });
}

export function MapProvider({
  active,
  traces,
  focused,
  usingDemo,
  darkInk,
  phase,
  weatherCode: _weatherCode,
  reducedMotion,
  onStatusChange,
}: Props) {
  void _weatherCode;
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const previousCameraRef = useRef<CameraTarget | null>(null);
  const travelTokenRef = useRef(0);
  const readyRef = useRef(false);
  const maxZoomRef = useRef(22);
  const clampAtlasRef = useRef(false);
  const [map, setMap] = useState<import("mapbox-gl").Map | null>(null);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [atlasMode, setAtlasMode] = useState<AtlasMode>("openfreemap");
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState !== "hidden",
  );
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();

  useEffect(() => {
    const onVisibility = () => {
      setPageVisible(document.visibilityState !== "hidden");
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    let disposed = false;
    let instance: import("mapbox-gl").Map | null = null;
    let failTimer: number | null = null;
    let pollTimer: number | null = null;

    const clearTimers = () => {
      if (failTimer !== null) window.clearTimeout(failTimer);
      if (pollTimer !== null) window.clearInterval(pollTimer);
      failTimer = null;
      pollTimer = null;
    };

    const markUnavailable = () => {
      if (disposed || readyRef.current) return;
      clearTimers();
      setMapUnavailable(true);
      onStatusChange("unavailable");
    };

    const markReady = (next: import("mapbox-gl").Map, mode: AtlasMode) => {
      if (disposed || readyRef.current) return;
      readyRef.current = true;
      clearTimers();
      try {
        next.resize();
      } catch {
        /* ignore */
      }
      setAtlasMode(mode);
      setMap(next);
      setMapUnavailable(false);
      if (hostRef.current) {
        hostRef.current.dataset.mapLifecycle = "loaded";
        hostRef.current.dataset.mapProvider = mode;
      }
      onStatusChange("ready");
    };

    const finishLoad = (next: import("mapbox-gl").Map, mode: AtlasMode) => {
      if (disposed || readyRef.current) return;
      try {
        applyAtlasPhase(next, phase);
        setPinGlow(next, active.lng, active.lat, active.located);
        const initial = cameraForTarget(active);
        const maxZoom = maxZoomRef.current;
        const camera: CameraTarget =
          mode === "openfreemap"
            ? {
                ...initial,
                pitch: Math.max(initial.pitch, 52),
                bearing: initial.bearing ?? -22,
                zoom: Math.min(Math.max(initial.zoom, 14), maxZoom),
              }
            : {
                ...initial,
                zoom: Math.min(initial.zoom, maxZoom),
              };
        next.jumpTo(camera);
        previousCameraRef.current = camera;
        markReady(next, mode);
      } catch (error) {
        console.error("map load handler failed", error);
        markUnavailable();
      }
    };

    const watchReady = (next: import("mapbox-gl").Map, mode: AtlasMode) => {
      const tryFinish = () => finishLoad(next, mode);
      next.once("load", tryFinish);
      next.once("idle", tryFinish);
      next.on("sourcedata", (event) => {
        if (readyRef.current || disposed) return;
        const e = event as {
          isSourceLoaded?: boolean;
          sourceDataType?: string;
        };
        if (e.isSourceLoaded && e.sourceDataType === "metadata") tryFinish();
      });
      pollTimer = window.setInterval(() => {
        if (disposed || readyRef.current) return;
        try {
          if (next.isStyleLoaded() || next.areTilesLoaded()) tryFinish();
        } catch {
          /* removed */
        }
      }, 500);
      failTimer = window.setTimeout(() => {
        if (disposed || readyRef.current) return;
        try {
          if ((next.getStyle()?.layers?.length ?? 0) > 2) {
            tryFinish();
            return;
          }
        } catch {
          /* ignore */
        }
        markUnavailable();
      }, 16000);
    };

    const createMap = async () => {
      if (!hostRef.current) return;
      hostRef.current.dataset.mapLifecycle = "initializing";
      readyRef.current = false;
      onStatusChange("loading");
      setMapUnavailable(false);

      try {
        if (disposed || !hostRef.current) return;

        if (token) {
          maxZoomRef.current = 22;
          clampAtlasRef.current = false;
          const mapbox = (await import("mapbox-gl")).default;
          mapbox.accessToken = token;
          instance = new mapbox.Map({
            container: hostRef.current,
            style: ATLAS_MAPBOX_STYLE,
            center: UNLOCATED_CENTER,
            zoom: 14,
            pitch: 52,
            bearing: -22,
            maxPitch: 85,
            attributionControl: true,
            antialias: false,
            failIfMajorPerformanceCaveat: false,
            interactive: true,
            dragPan: true,
            scrollZoom: true,
            boxZoom: true,
            dragRotate: true,
            keyboard: true,
            doubleClickZoom: true,
            touchZoomRotate: true,
            fadeDuration: reducedMotion ? 0 : 300,
          });
          watchReady(instance, "mapbox");
        } else {
          maxZoomRef.current = 14;
          clampAtlasRef.current = true;
          const maplibre = await import("maplibre-gl");
          if (typeof maplibre.setWorkerUrl === "function") {
            maplibre.setWorkerUrl("/maplibre-gl-worker.mjs");
          }
          if (disposed || !hostRef.current) return;
          instance = new maplibre.Map({
            container: hostRef.current,
            style: ATLAS_OPENFREEMAP_STYLE as never,
            center: UNLOCATED_CENTER,
            zoom: 14,
            pitch: 52,
            bearing: -22,
            maxPitch: 85,
            maxZoom: 14,
            attributionControl: { compact: true },
            canvasContextAttributes: { antialias: false },
            localIdeographFontFamily: "sans-serif",
            interactive: true,
            dragPan: true,
            scrollZoom: true,
            boxZoom: true,
            dragRotate: true,
            keyboard: true,
            doubleClickZoom: true,
            touchZoomRotate: true,
            fadeDuration: reducedMotion ? 0 : 300,
          }) as unknown as import("mapbox-gl").Map;
          watchReady(instance, "openfreemap");
        }

        instance.on("error", (event) => {
          if (disposed || readyRef.current) return;
          console.warn("map error", (event as { error?: unknown }).error ?? event);
        });

        if (hostRef.current) {
          hostRef.current.dataset.mapLifecycle = "instance-created";
        }
        mapRef.current = instance;
      } catch (error) {
        console.error("map initialization failed", error);
        markUnavailable();
      }
    };

    void createMap();
    return () => {
      disposed = true;
      readyRef.current = false;
      clearTimers();
      travelTokenRef.current += 1;
      try {
        instance?.remove();
      } catch {
        /* ignore */
      }
      mapRef.current = null;
      setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const next = mapRef.current;
    if (!next) return;
    try {
      if (pageVisible) {
        next.resize();
        next.triggerRepaint();
      }
    } catch {
      /* ignore */
    }
  }, [pageVisible]);

  useEffect(() => {
    if (!map || !pageVisible) return;
    const previous = previousCameraRef.current;
    const plan = planCameraMotion(previous, active, reducedMotion);
    const tokenId = ++travelTokenRef.current;
    const camOpts = {
      maxZoom: maxZoomRef.current,
      clampAtlas: clampAtlasRef.current,
    };

    if (plan.kind === "jump") {
      applyCamera(map, plan.camera, "jump", undefined, camOpts);
      previousCameraRef.current = plan.camera;
      return;
    }

    if (plan.kind === "ease") {
      applyCamera(map, plan.camera, "ease", plan.duration, camOpts);
      previousCameraRef.current = plan.camera;
      return;
    }

    const third = plan.durationMs / 3;
    applyCamera(map, plan.overview, "ease", third, camOpts);
    window.setTimeout(() => {
      if (travelTokenRef.current !== tokenId || !mapRef.current) return;
      applyCamera(mapRef.current, plan.midpoint, "ease", third, camOpts);
    }, third);
    window.setTimeout(() => {
      if (travelTokenRef.current !== tokenId || !mapRef.current) return;
      applyCamera(mapRef.current, plan.settle, "ease", third, camOpts);
      previousCameraRef.current = plan.settle;
    }, third * 2);
  }, [active, map, pageVisible, reducedMotion]);

  useEffect(() => {
    if (!map || !pageVisible) return;
    applyAtlasPhase(map, phase);
  }, [map, phase, atlasMode, pageVisible]);

  useEffect(() => {
    if (!map || !pageVisible) return;
    setPinGlow(map, active.lng, active.lat, active.located);
  }, [map, pageVisible, active.lng, active.lat, active.located]);

  return (
    <>
      <div className="absolute inset-0 z-0">
        <div
          ref={hostRef}
          className="h-full w-full"
          data-map-provider={token ? "mapbox" : "openfreemap-3d"}
        />
      </div>
      {mapUnavailable ? (
        <MapUnavailablePanel unlocated={!active.located} />
      ) : null}
      {map && !mapUnavailable ? (
        <MapMemoryMarkers
          map={map}
          atlasMode={atlasMode}
          active={active}
          traces={traces}
          focused={focused}
          usingDemo={usingDemo}
          darkInk={darkInk}
          reducedMotion={reducedMotion}
        />
      ) : null}
    </>
  );
}
