"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { photoPublicUrl } from "@/lib/format";
import type { GuestEntry } from "@/lib/types";
import { PostcardPopout } from "@/components/guest/PostcardPopout";
import { GuestSpecialBadge } from "@/components/guest/GuestSpecialBadge";

function postcardTone(index: number) {
  const tones = ["#2a2a2c", "#3a3530", "#4a4540", "#2f3438", "#3c3834"];
  return tones[index % tones.length];
}

function stampValue(iso: string, index: number) {
  const date = new Date(iso);
  if (!Number.isNaN(date.getTime())) {
    return date.getDate().toString().padStart(2, "0");
  }
  return (index + 1).toString().padStart(2, "0");
}

function shortStampDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}

function MiniPostcard({
  entry,
  index,
  onOpen,
}: {
  entry: GuestEntry;
  index: number;
  onOpen: () => void;
}) {
  const photo = entry.photo_path ? photoPublicUrl(entry.photo_path) : null;
  const tone = postcardTone(index);
  const primary = entry.location_name?.trim() || entry.name;
  const secondaryDate = shortStampDate(entry.created_at);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative mx-auto w-full max-w-[156px] text-left"
      aria-label={`Open postcard from ${entry.name}`}
    >
      <div className="transition-[transform,filter] duration-300 ease-out [filter:drop-shadow(0_8px_18px_rgba(0,0,0,0.2))] group-hover:-translate-y-1.5 group-hover:rotate-[-2deg] group-hover:[filter:drop-shadow(0_14px_26px_rgba(0,0,0,0.28))]">
        <div className="stamp-perforation aspect-[3/4] w-full">
          <div className="relative h-full w-full overflow-hidden bg-[#ececef]">
            {photo ? (
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full" style={{ background: tone }} />
            )}

            <span className="absolute right-1.5 top-1.5 font-mono text-[10px] font-semibold leading-none tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
              {stampValue(entry.created_at, index)}
            </span>

            <GuestSpecialBadge
              createdAt={entry.created_at}
              compact
              tooltipAlign="start"
              className="!bottom-auto !left-2.5 !right-auto !top-2.5"
            />

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-2 pb-2 pt-8">
              <p className="line-clamp-2 text-[11px] font-semibold leading-tight tracking-tight text-white">
                {primary}
              </p>
              <p className="mt-0.5 truncate text-[8px] font-medium uppercase tracking-[0.12em] text-white/75">
                {entry.location_name ? entry.name : secondaryDate}
                {entry.location_name && secondaryDate ? ` · ${secondaryDate}` : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export function PostcardWall({ entries }: { entries: GuestEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIndex = entries.findIndex((entry) => entry.id === activeId);
  const active = activeIndex >= 0 ? entries[activeIndex] : null;

  return (
    <>
      {entries.length === 0 ? (
        <p className="mt-16 text-center text-sm text-black/45">
          No guest postcards yet. Hand out a QR and the wall will fill.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 md:gap-4 lg:grid-cols-8">
          {entries.map((entry, index) => (
            <MiniPostcard
              key={entry.id}
              entry={entry}
              index={index}
              onOpen={() => setActiveId(entry.id)}
            />
          ))}
        </div>
      )}
      <AnimatePresence>
        {active ? (
          <PostcardPopout
            entry={active}
            index={activeIndex}
            onClose={() => setActiveId(null)}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
