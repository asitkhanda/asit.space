"use client";

/* eslint-disable @next/next/no-img-element */

import gsap from "gsap";
import { useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";
import { formatPostDate, photoPublicUrl } from "@/lib/format";
import type { PostWithPeople } from "@/lib/types";
import type { MapTarget } from "./map-geography";
import { UNLOCATED_LABEL } from "./map-geography";
import { PIN_SPOTLIGHT } from "./map-style";

type AtlasMode = "mapbox" | "openfreemap";

type Props = {
  map: mapboxgl.Map;
  atlasMode: AtlasMode;
  active: MapTarget;
  traces: MapTarget[];
  focused: PostWithPeople;
  usingDemo: boolean;
  darkInk: boolean;
  reducedMotion: boolean;
};

const ACTIVE_FILL = PIN_SPOTLIGHT;
const PAST_FILL = "#8a8a90";
const EDGE_PAD = 20;
const BUBBLE_WIDTH = "min(280px, 72vw)";
const BUBBLE_WIDTH_PORTRAIT = "min(220px, 56vw)";

function applyMediaAspect(media: HTMLElement, bubble: HTMLElement, portrait: boolean) {
  media.style.aspectRatio = portrait ? "3 / 4" : "4 / 3";
  bubble.style.width = portrait ? BUBBLE_WIDTH_PORTRAIT : BUBBLE_WIDTH;
}

function pinSvg(size: number, fill: string, hole = false) {
  const w = size;
  const h = Math.round(size * 1.35);
  const holeCircle = hole
    ? `<circle cx="${w / 2}" cy="${h * 0.38}" r="${size * 0.14}" fill="#3a3a40"/>`
    : "";
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M${w / 2} ${h} C${w * 0.22} ${h * 0.62} ${w * 0.08} ${h * 0.42} ${w * 0.08} ${h * 0.32}
    A${w * 0.42} ${w * 0.42} 0 1 1 ${w * 0.92} ${h * 0.32}
    C${w * 0.92} ${h * 0.42} ${w * 0.78} ${h * 0.62} ${w / 2} ${h}Z"
    fill="${fill}" stroke="#2a2a2e" stroke-width="1.5" stroke-linejoin="round"/>
  ${holeCircle}
</svg>`;
}

function createPastEl() {
  const el = document.createElement("div");
  el.className = "map-memory-pin map-memory-pin--past";
  el.style.cssText =
    "width:14px;height:19px;pointer-events:none;will-change:transform;";
  el.innerHTML = pinSvg(14, PAST_FILL, false);
  return el;
}

function createActiveEl() {
  const root = document.createElement("div");
  root.className = "map-memory-active";
  root.style.cssText = "pointer-events:none;";

  // Inner wrapper for GSAP — Mapbox Marker owns transform on `root`.
  const anim = document.createElement("div");
  anim.className = "map-memory-active-inner";
  anim.style.cssText =
    "display:flex;flex-direction:column;align-items:center;will-change:transform,opacity;transform-origin:50% 100%;";

  const bubble = document.createElement("div");
  bubble.className = "map-memory-photo";
  bubble.style.cssText = `width:${BUBBLE_WIDTH};overflow:hidden;border-radius:22px;box-shadow:0 22px 48px rgba(0,0,0,0.3),0 0 0 1px rgba(0,0,0,0.08);margin-bottom:8px;background:rgba(255,255,255,0.94);backdrop-filter:blur(8px);`;

  const media = document.createElement("div");
  media.className = "map-memory-photo-media";
  media.style.cssText =
    "position:relative;aspect-ratio:4/3;width:100%;background:#c8c8cc;";

  const caption = document.createElement("div");
  caption.className = "map-memory-photo-caption";
  caption.style.cssText =
    "position:absolute;inset-inline:0;bottom:0;padding:14px 16px 16px;background:linear-gradient(to top,rgba(0,0,0,0.78),transparent);color:#fff;";

  media.appendChild(caption);
  bubble.appendChild(media);

  const pinWrap = document.createElement("div");
  pinWrap.className = "map-memory-pin map-memory-pin--active";
  pinWrap.style.cssText = "width:24px;height:32px;line-height:0;";
  pinWrap.innerHTML = pinSvg(24, ACTIVE_FILL, true);

  anim.appendChild(bubble);
  anim.appendChild(pinWrap);
  root.appendChild(anim);
  return { root, anim, bubble, media, caption, pinWrap };
}

function fillActiveContent(
  parts: ReturnType<typeof createActiveEl>,
  focused: PostWithPeople,
  usingDemo: boolean,
) {
  const { media, caption, bubble } = parts;
  const existingImg = media.querySelector("img");
  existingImg?.remove();
  const placeholder = media.querySelector(".map-memory-photo-empty");
  placeholder?.remove();
  applyMediaAspect(media, bubble, false);

  const photoSrc = focused.photo_path ? photoPublicUrl(focused.photo_path) : null;
  if (photoSrc) {
    const img = document.createElement("img");
    img.src = photoSrc;
    img.alt = focused.location_name || UNLOCATED_LABEL;
    img.decoding = "async";
    img.style.cssText =
      "height:100%;width:100%;object-fit:cover;object-position:center;display:block;image-rendering:auto;";
    img.onload = () => {
      const portrait = img.naturalHeight > img.naturalWidth;
      applyMediaAspect(media, bubble, portrait);
      clampBubble(parts.root, parts.bubble);
    };
    media.insertBefore(img, caption);
  } else {
    const empty = document.createElement("div");
    empty.className = "map-memory-photo-empty";
    empty.style.cssText =
      "display:flex;height:100%;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:20px;text-align:center;";
    empty.innerHTML = `<p style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.5;font-family:var(--font-sans),system-ui,sans-serif;font-weight:500;">${usingDemo ? "Demo moment" : "No photo"}</p><p style="font-size:12px;opacity:0.45;font-family:var(--font-sans),system-ui,sans-serif;">The landmark is this moment.</p>`;
    media.insertBefore(empty, caption);
  }

  caption.innerHTML = `<p style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.75;font-family:var(--font-sans),system-ui,sans-serif;font-weight:500;margin:0;">${formatPostDate(focused.occurred_at)}</p><p style="margin:6px 0 0;font-size:22px;font-weight:500;line-height:1.15;font-family:var(--font-sans),system-ui,sans-serif;">${focused.location_name || UNLOCATED_LABEL}</p>`;
}

function clampBubble(root: HTMLElement, bubble: HTMLElement) {
  bubble.style.transform = "";
  const rect = bubble.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let dx = 0;
  let dy = 0;
  if (rect.left < EDGE_PAD) dx = EDGE_PAD - rect.left;
  if (rect.right > vw - EDGE_PAD) dx = vw - EDGE_PAD - rect.right;
  if (rect.top < EDGE_PAD) dy = EDGE_PAD - rect.top;
  // Keep tip pinned — only nudge bubble, not whole marker, via bubble transform
  if (dx || dy) {
    bubble.style.transform = `translate(${dx}px, ${dy}px)`;
  }
  void root;
}

type MarkerLike = {
  setLngLat: (lngLat: [number, number]) => MarkerLike;
  addTo: (map: mapboxgl.Map) => MarkerLike;
  remove: () => void;
  getElement: () => HTMLElement;
};

async function loadMarkerCtor(
  atlasMode: AtlasMode,
): Promise<new (options?: { element?: HTMLElement; anchor?: string }) => MarkerLike> {
  if (atlasMode === "mapbox") {
    const mapbox = (await import("mapbox-gl")).default;
    return mapbox.Marker as unknown as new (options?: {
      element?: HTMLElement;
      anchor?: string;
    }) => MarkerLike;
  }
  const maplibre = await import("maplibre-gl");
  return maplibre.Marker as unknown as new (options?: {
    element?: HTMLElement;
    anchor?: string;
  }) => MarkerLike;
}

export function MapMemoryMarkers({
  map,
  atlasMode,
  active,
  traces,
  focused,
  usingDemo,
  darkInk,
  reducedMotion,
}: Props) {
  const pastRef = useRef<MarkerLike[]>([]);
  const activeRef = useRef<MarkerLike | null>(null);
  const partsRef = useRef<ReturnType<typeof createActiveEl> | null>(null);
  const markerCtorRef = useRef<Awaited<ReturnType<typeof loadMarkerCtor>> | null>(
    null,
  );

  // Load Marker constructor once per atlas mode.
  useEffect(() => {
    let cancelled = false;
    void loadMarkerCtor(atlasMode).then((Ctor) => {
      if (!cancelled) markerCtorRef.current = Ctor;
    });
    return () => {
      cancelled = true;
    };
  }, [atlasMode]);

  // Past pins
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const Ctor =
        markerCtorRef.current ?? (await loadMarkerCtor(atlasMode));
      if (cancelled) return;
      markerCtorRef.current = Ctor;

      pastRef.current.forEach((marker) => marker.remove());
      pastRef.current = [];

      traces.forEach((trace) => {
        if (
          trace.lng == null ||
          trace.lat == null ||
          trace.id === active.id ||
          !trace.located
        ) {
          return;
        }
        const el = createPastEl();
        const marker = new Ctor({ element: el, anchor: "bottom" })
          .setLngLat([trace.lng, trace.lat])
          .addTo(map);
        pastRef.current.push(marker);
      });
    };
    void run();
    return () => {
      cancelled = true;
      pastRef.current.forEach((marker) => marker.remove());
      pastRef.current = [];
    };
  }, [active.id, atlasMode, map, traces]);

  // Active pin + photo bubble
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const Ctor =
        markerCtorRef.current ?? (await loadMarkerCtor(atlasMode));
      if (cancelled) return;
      markerCtorRef.current = Ctor;

      activeRef.current?.remove();
      activeRef.current = null;
      partsRef.current = null;

      if (active.lng == null || active.lat == null || !active.located) {
        return;
      }

      const parts = createActiveEl();
      fillActiveContent(parts, focused, usingDemo);
      partsRef.current = parts;

      const marker = new Ctor({ element: parts.root, anchor: "bottom" })
        .setLngLat([active.lng, active.lat])
        .addTo(map);
      activeRef.current = marker;

      const duration = reducedMotion ? 0 : 0.5;
      gsap.fromTo(
        parts.anim,
        { opacity: 0, y: -18, scale: 0.86 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration,
          ease: "back.out(1.6)",
          onComplete: () => clampBubble(parts.root, parts.bubble),
        },
      );
      gsap.fromTo(
        parts.bubble,
        { opacity: 0.4, y: 10 },
        { opacity: 1, y: 0, duration: reducedMotion ? 0 : 0.45, ease: "power3.out" },
      );

      const onMove = () => clampBubble(parts.root, parts.bubble);
      map.on("moveend", onMove);
      map.on("resize", onMove);
      window.addEventListener("resize", onMove);
      // Stash cleanup on element
      (parts.root as HTMLElement & { __cleanup?: () => void }).__cleanup = () => {
        map.off("moveend", onMove);
        map.off("resize", onMove);
        window.removeEventListener("resize", onMove);
      };
      requestAnimationFrame(() => clampBubble(parts.root, parts.bubble));
    };
    void run();
    return () => {
      cancelled = true;
      const root = partsRef.current?.root as
        | (HTMLElement & { __cleanup?: () => void })
        | undefined;
      root?.__cleanup?.();
      activeRef.current?.remove();
      activeRef.current = null;
      partsRef.current = null;
    };
  }, [
    active.id,
    active.lat,
    active.lng,
    active.located,
    atlasMode,
    focused,
    map,
    reducedMotion,
    usingDemo,
  ]);

  // Keep active marker lng/lat in sync during interpolate hops
  useEffect(() => {
    if (
      !activeRef.current ||
      active.lng == null ||
      active.lat == null ||
      !active.located
    ) {
      return;
    }
    activeRef.current.setLngLat([active.lng, active.lat]);
    if (partsRef.current) {
      clampBubble(partsRef.current.root, partsRef.current.bubble);
    }
  }, [active.lat, active.lng, active.located]);

  const showFallback = !active.located || active.lng == null || active.lat == null;
  const photoSrc = focused.photo_path ? photoPublicUrl(focused.photo_path) : null;

  if (!showFallback) return null;

  return (
    <FallbackPhotoCard
      focused={focused}
      usingDemo={usingDemo}
      darkInk={darkInk}
      photoSrc={photoSrc}
    />
  );
}

function FallbackPhotoCard({
  focused,
  usingDemo,
  darkInk,
  photoSrc,
}: {
  focused: PostWithPeople;
  usingDemo: boolean;
  darkInk: boolean;
  photoSrc: string | null;
}) {
  const mediaRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`pointer-events-none absolute bottom-24 left-1/2 z-[4] w-[min(280px,72vw)] -translate-x-1/2 overflow-hidden rounded-[22px] shadow-[0_22px_48px_rgba(0,0,0,0.3)] ring-1 backdrop-blur-sm ${darkInk ? "bg-black/50 ring-white/20" : "bg-white/94 ring-black/10"}`}
    >
      <div
        ref={mediaRef}
        className="relative aspect-[4/3] w-full bg-[#c8c8cc] data-[portrait=true]:aspect-[3/4] data-[portrait=true]:mx-auto data-[portrait=true]:w-[min(220px,56vw)]"
      >
        {photoSrc ? (
          <img
            src={photoSrc}
            alt={focused.location_name || UNLOCATED_LABEL}
            decoding="async"
            className="h-full w-full object-cover object-center"
            onLoad={(event) => {
              const img = event.currentTarget;
              const portrait = img.naturalHeight > img.naturalWidth;
              const media = mediaRef.current;
              if (!media) return;
              media.dataset.portrait = portrait ? "true" : "false";
              const card = media.parentElement;
              if (card) {
                card.style.width = portrait
                  ? "min(220px, 56vw)"
                  : "min(280px, 72vw)";
              }
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <p
              className={`text-[11px] font-medium uppercase tracking-[0.14em] ${darkInk ? "text-white/55" : "text-black/45"}`}
            >
              {usingDemo ? "Demo moment" : "No photo"}
            </p>
            <p className={`text-xs ${darkInk ? "text-white/45" : "text-black/45"}`}>
              The landmark is this moment.
            </p>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 text-white">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/70">
            {formatPostDate(focused.occurred_at)}
          </p>
          <p className="font-serif mt-1.5 text-[22px] leading-tight">
            {focused.location_name || UNLOCATED_LABEL}
          </p>
        </div>
      </div>
    </div>
  );
}
