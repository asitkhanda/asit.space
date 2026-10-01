"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { phaseIndexForProgress, phaseLookForProgress, type DayPhase } from "@/lib/map-phases";
import { useSiteChrome } from "@/components/nav/SiteChromeContext";
import { MapProvider } from "./MapProvider";
import {
  interpolateTargets,
  isGeoPost,
  realTargets,
  targetForPost,
  UNLOCATED_LABEL,
} from "./map-geography";
import type { PostWithPeople } from "@/lib/types";

type WeatherState =
  | { status: "loading" }
  | { status: "ready"; tempC: number; code: number; label: string }
  | { status: "unavailable" };

const WMO: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Drizzle",
  61: "Rain",
  71: "Snow",
  80: "Showers",
  95: "Thunder",
};

function weatherLabel(code: number) {
  return WMO[code] ?? "Weather";
}

function weatherMood(code: number): string {
  if (code >= 95) return "Electric";
  if (code >= 71) return "Powder day";
  if (code >= 80) return "Puddle season";
  if (code >= 61) return "Bring a coat";
  if (code >= 51) return "Soft drizzle";
  if (code >= 45) return "Soft focus";
  if (code >= 3) return "Cloudy head";
  if (code >= 2) return "Half sunshine";
  if (code >= 1) return "Mostly bright";
  return "Golden hour";
}

const DEMO_POSTS: PostWithPeople[] = [
  {
    id: "demo-1",
    occurred_at: new Date().toISOString(),
    location_name: "Cubbon Park",
    lat: 12.9766,
    lng: 77.5929,
    maps_url: "https://maps.google.com/?q=12.9766,77.5929",
    photo_path: "",
    like_count: 0,
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    people: [],
  },
  {
    id: "demo-2",
    occurred_at: new Date(Date.now() - 86400000 * 40).toISOString(),
    location_name: "Marine Drive",
    lat: 18.9432,
    lng: 72.8236,
    maps_url: "https://maps.google.com/?q=18.9432,72.8236",
    photo_path: "",
    like_count: 0,
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    people: [],
  },
  {
    id: "demo-3",
    occurred_at: new Date(Date.now() - 86400000 * 120).toISOString(),
    location_name: "Hampi",
    lat: 15.335,
    lng: 76.46,
    maps_url: "https://maps.google.com/?q=15.335,76.46",
    photo_path: "",
    like_count: 0,
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    people: [],
  },
  {
    id: "demo-4",
    occurred_at: new Date(Date.now() - 86400000 * 200).toISOString(),
    location_name: "Jaipur",
    lat: 26.9124,
    lng: 75.7873,
    maps_url: "https://maps.google.com/?q=26.9124,75.7873",
    photo_path: "",
    like_count: 0,
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    people: [],
  },
  {
    id: "demo-5",
    occurred_at: new Date(Date.now() - 86400000 * 260).toISOString(),
    location_name: "A note without a pin",
    lat: null,
    lng: null,
    maps_url: null,
    photo_path: "",
    like_count: 0,
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    people: [],
  },
];

function MapNavButton({
  direction,
  disabled,
  darkInk,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  darkInk: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous memory" : "Next memory"}
      className={`pointer-events-auto flex size-12 items-center justify-center rounded-2xl backdrop-blur-md transition-opacity disabled:pointer-events-none disabled:opacity-30 ${
        darkInk
          ? "bg-white/12 text-white ring-1 ring-white/20 hover:bg-white/20"
          : "bg-black/8 text-black ring-1 ring-black/10 hover:bg-black/12"
      }`}
    >
      <HugeiconsIcon
        icon={direction === "prev" ? ArrowLeft01Icon : ArrowRight01Icon}
        size={22}
        strokeWidth={2.4}
        color="currentColor"
      />
    </button>
  );
}

export function MapTimeline({ posts }: { posts: PostWithPeople[] }) {
  const { setChrome, resetChrome } = useSiteChrome();
  const displayPosts = useMemo(() => (posts.length ? posts : DEMO_POSTS), [posts]);
  const usingDemo = posts.length === 0;
  const latestGeo = displayPosts.find(isGeoPost) ?? null;
  const targets = useMemo(() => displayPosts.map(targetForPost), [displayPosts]);
  const traces = useMemo(() => realTargets(displayPosts), [displayPosts]);
  const [progress, setProgress] = useState(0);
  const [weather, setWeather] = useState<WeatherState>(() =>
    latestGeo ? { status: "loading" } : { status: "unavailable" },
  );
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const focusedIndex = Math.min(
    displayPosts.length - 1,
    Math.max(0, Math.round(progress)),
  );
  const focused = displayPosts[focusedIndex];
  const phaseIndex = phaseIndexForProgress(progress);
  const phase = phaseLookForProgress(progress);
  const phaseId: DayPhase = phase.id;
  const darkInk = phaseId === "evening" || phaseId === "night";
  const lower = Math.floor(progress);
  const activeTarget = interpolateTargets(
    targets[lower],
    targets[Math.ceil(progress)],
    progress - lower,
  );
  const canGoPrev = focusedIndex > 0;
  const canGoNext = focusedIndex < displayPosts.length - 1;

  const goToMemory = useCallback(
    (index: number) => {
      const max = Math.max(0, displayPosts.length - 1);
      setProgress(Math.min(max, Math.max(0, index)));
    },
    [displayPosts.length],
  );

  useEffect(() => {
    if (!latestGeo) return;
    let cancelled = false;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latestGeo.lat}&longitude=${latestGeo.lng}&current=temperature_2m,weather_code`,
    )
      .then((response) => {
        if (!response.ok) throw new Error("weather request failed");
        return response.json();
      })
      .then((data) => {
        const tempC = data?.current?.temperature_2m;
        const code = data?.current?.weather_code;
        if (typeof tempC !== "number" || typeof code !== "number") {
          throw new Error("weather response incomplete");
        }
        if (!cancelled) {
          setWeather({ status: "ready", tempC, code, label: weatherLabel(code) });
        }
      })
      .catch(() => {
        if (!cancelled) setWeather({ status: "unavailable" });
      });
    return () => {
      cancelled = true;
    };
  }, [latestGeo]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)
      ) {
        return;
      }
      if (
        !["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "j", "k"].includes(
          event.key,
        )
      ) {
        return;
      }
      event.preventDefault();
      const next =
        event.key === "ArrowDown" ||
        event.key === "ArrowRight" ||
        event.key === "j";
      goToMemory(focusedIndex + (next ? 1 : -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusedIndex, goToMemory]);

  useEffect(() => {
    const placeName =
      focused.location_name || (latestGeo?.location_name ?? UNLOCATED_LABEL);
    const mapsUrl =
      focused.maps_url ??
      (focused.lat != null && focused.lng != null
        ? `https://maps.google.com/?q=${focused.lat},${focused.lng}`
        : null);

    setChrome({
      placeName,
      mapsUrl,
      onDarkSurface: darkInk,
      weather:
        weather.status === "ready"
          ? {
              status: "ready",
              tempC: weather.tempC,
              mood: weatherMood(weather.code),
              code: weather.code,
            }
          : weather.status === "loading"
            ? { status: "loading" }
            : { status: "unavailable" },
    });
  }, [focused, latestGeo, weather, darkInk, setChrome]);

  useEffect(() => () => resetChrome(), [resetChrome]);

  const weatherCode = weather.status === "ready" ? weather.code : null;

  return (
    <main
      className={`map-lab relative h-dvh min-h-dvh w-full overflow-hidden ${darkInk ? "text-white" : "text-black"}`}
      style={{ background: phase.sky }}
      aria-label="Hey There! memory atlas"
    >
      <MapProvider
        active={activeTarget}
        traces={traces}
        focused={focused}
        usingDemo={usingDemo}
        darkInk={darkInk}
        phase={phase}
        weatherCode={weatherCode}
        reducedMotion={reducedMotion}
        onStatusChange={setMapStatus}
      />
      <div className="pointer-events-none absolute inset-0 z-[3] flex flex-col justify-between p-5 pt-24 md:p-8 md:pt-28">
        <div className="pointer-events-none flex flex-1 items-center justify-between gap-4 py-6">
          <MapNavButton
            direction="prev"
            disabled={!canGoPrev}
            darkInk={darkInk}
            onClick={() => goToMemory(focusedIndex - 1)}
          />
          <MapNavButton
            direction="next"
            disabled={!canGoNext}
            darkInk={darkInk}
            onClick={() => goToMemory(focusedIndex + 1)}
          />
        </div>

        <footer
          className={`pointer-events-auto flex items-end justify-between gap-4 ${darkInk ? "text-white" : "text-black"}`}
        >
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em]">
              {phase.label}
            </p>
            <p
              className={`mt-1 text-xs ${darkInk ? "text-white/55" : "text-black/50"}`}
            >
              {usingDemo ? "Demo · " : ""}Drag to pan · scroll to zoom
            </p>
          </div>
          <div
            className="flex items-center gap-1"
            aria-label={`Memory ${focusedIndex + 1} of ${displayPosts.length}`}
          >
            {displayPosts.map((post, index) => (
              <button
                key={post.id}
                type="button"
                aria-label={`Go to memory ${index + 1}`}
                onClick={() => goToMemory(index)}
                className={`size-2 rounded-full transition-all ${index === focusedIndex ? "scale-125 bg-current" : darkInk ? "bg-white/35 hover:bg-white/70" : "bg-black/25 hover:bg-black/55"}`}
              />
            ))}
          </div>
        </footer>
      </div>
      {mapStatus === "unavailable" ? (
        <div
          className={`pointer-events-none absolute bottom-14 left-5 z-[3] max-w-[330px] text-[10px] uppercase tracking-[0.18em] opacity-55 ${darkInk ? "text-white" : "text-black"}`}
        >
          Map unavailable
        </div>
      ) : mapStatus === "loading" ? (
        <div
          className={`pointer-events-none absolute bottom-14 left-5 z-[3] max-w-[280px] text-[10px] uppercase tracking-[0.18em] opacity-45 ${darkInk ? "text-white" : "text-black"}`}
        >
          Loading 3D atlas…
        </div>
      ) : null}
      <div
        className={`pointer-events-none absolute bottom-0 left-0 right-0 z-[1] h-32 bg-gradient-to-t ${darkInk ? "from-black/25" : "from-white/35"} to-transparent`}
      />
      <span className="sr-only" aria-live="polite">
        {focused.location_name}, {phase.label}, memory {focusedIndex + 1} of{" "}
        {displayPosts.length}
      </span>
      <span className="sr-only">
        {mapStatus === "ready"
          ? "Real-world map loaded"
          : "Real-world map unavailable"}
        . Phase index {phaseIndex + 1}
      </span>
    </main>
  );
}
