"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { formatPostDate, photoPublicUrl } from "@/lib/format";
import type { GuestEntry } from "@/lib/types";

type BackVariant = "correspondence" | "typed";
type Side = "front" | "back";

/** Shared paper face — perforated grooves on every postcard side. */
function PostcardShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`stamp-perforation h-full w-full bg-[var(--color-postcard-cream)] ${className}`}
    >
      {children}
    </div>
  );
}

function backVariantFor(index: number): BackVariant {
  return index % 2 === 0 ? "correspondence" : "typed";
}

function stampDay(iso: string, index: number) {
  const date = new Date(iso);
  if (!Number.isNaN(date.getTime())) {
    return date.getDate().toString().padStart(2, "0");
  }
  return (index + 1).toString().padStart(2, "0");
}

function displayTitle(entry: GuestEntry) {
  return entry.location_name?.trim() || entry.name;
}

function noteText(entry: GuestEntry) {
  return entry.note?.trim() || "A quiet mark.";
}

function coordsLine(entry: GuestEntry) {
  if (entry.lat == null || entry.lng == null) return null;
  return `${entry.lat.toFixed(3)}, ${entry.lng.toFixed(3)}`;
}

function MiniStampFace({
  photo,
  day,
  className = "",
}: {
  photo: string | null;
  day: string;
  className?: string;
}) {
  return (
    <div className={`stamp-perforation ${className}`}>
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#3a3530]">
        {photo ? (
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-lg font-semibold text-white/80">
            {day}
          </div>
        )}
      </div>
    </div>
  );
}

/** Image fills the shared landscape card face. */
function SouvenirFront({
  entry,
  photo,
}: {
  entry: GuestEntry;
  photo: string;
}) {
  const title = displayTitle(entry);

  return (
    <PostcardShell>
      <div className="relative h-full w-full overflow-hidden bg-[#2a2a2c]">
        <img
          src={photo}
          alt={`Photo from ${entry.name}`}
          className="h-full w-full object-cover"
        />
        <p className="font-postcard-script absolute inset-x-4 bottom-5 text-center text-4xl leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] sm:bottom-7 sm:text-5xl md:text-6xl">
          {title}
        </p>
      </div>
    </PostcardShell>
  );
}

function CorrespondenceBack({
  entry,
  index,
  photo,
}: {
  entry: GuestEntry;
  index: number;
  photo: string | null;
}) {
  const ink = "text-[var(--color-postcard-ink)]";
  const year = new Date(entry.created_at).getFullYear();
  const coords = coordsLine(entry);
  const day = stampDay(entry.created_at, index);

  return (
    <PostcardShell>
      <div className="grid h-full gap-5 overflow-y-auto px-4 py-4 sm:grid-cols-[1.1fr_1px_0.9fr] sm:gap-0 sm:px-6 sm:py-5">
        <div className="sm:pr-6">
          <p className={`text-[10px] font-medium uppercase tracking-[0.18em] ${ink}`}>
            This space for writing
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-black/75">{noteText(entry)}</p>
        </div>

        <div className="relative hidden sm:block">
          <div className="absolute inset-y-0 left-0 w-px bg-[var(--color-postcard-ink)]/70" />
          <p
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.22em] ${ink}`}
          >
            Hey There! · {Number.isNaN(year) ? "" : year}
          </p>
        </div>

        <div className="border-t border-[var(--color-postcard-ink)]/30 pt-4 sm:border-t-0 sm:pl-6 sm:pt-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className={`font-postcard-serif text-2xl font-bold tracking-tight sm:text-3xl ${ink}`}>
                Post Card
              </h2>
              <p className={`mt-1 text-[9px] font-medium uppercase tracking-[0.16em] ${ink}`}>
                This side is for the address
              </p>
            </div>
            <div className="w-14 shrink-0 sm:w-16">
              <MiniStampFace photo={photo} day={day} />
            </div>
          </div>

          <div className={`mt-5 space-y-2.5 border-[var(--color-postcard-ink)]/45 ${ink}`}>
            <p className="border-b border-current/40 pb-1.5 text-sm text-black/80">{entry.name}</p>
            <p className="border-b border-current/40 pb-1.5 text-sm text-black/80">
              {entry.location_name?.trim() || "Somewhere along the way"}
            </p>
            <p className="border-b border-current/40 pb-1.5 text-sm text-black/80">
              {formatPostDate(entry.created_at)}
            </p>
            {coords ? (
              <p className="border-b border-current/40 pb-1.5 font-mono text-xs text-black/60">
                {coords}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </PostcardShell>
  );
}

function TypedPerforated({
  entry,
  index,
  photo,
}: {
  entry: GuestEntry;
  index: number;
  photo: string | null;
}) {
  const title = displayTitle(entry);
  const coords = coordsLine(entry);
  const day = stampDay(entry.created_at, index);

  return (
    <PostcardShell>
      <div className="flex h-full flex-col overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-black/45">
            Guest postcard
          </p>
          <div className="w-12 shrink-0 sm:w-14">
            <MiniStampFace photo={photo} day={day} />
          </div>
        </div>

        <div className="mt-4 grid flex-1 gap-6 sm:grid-cols-[1.15fr_1px_0.85fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl">
              {title}
            </h2>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-black/40">
              {formatPostDate(entry.created_at)}
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-black/70">{noteText(entry)}</p>
          </div>

          <div className="hidden bg-black/20 sm:block" />

          <div className="border-t border-black/10 pt-4 sm:border-t-0 sm:pt-0">
            <div className="space-y-2.5">
              <p className="border-b border-black/25 pb-1.5 text-sm text-black/80">{entry.name}</p>
              <p className="border-b border-black/25 pb-1.5 text-sm text-black/80">
                {formatPostDate(entry.created_at)}
              </p>
              {coords ? (
                <p className="border-b border-black/25 pb-1.5 font-mono text-xs text-black/55">
                  {coords}
                </p>
              ) : (
                <p className="border-b border-black/25 pb-1.5 text-sm text-black/35">—</p>
              )}
              <p className="border-b border-black/25 pb-1.5 text-sm text-black/35">asit.space</p>
            </div>
          </div>
        </div>
      </div>
    </PostcardShell>
  );
}

function BackFace({
  entry,
  index,
  photo,
  variant,
}: {
  entry: GuestEntry;
  index: number;
  photo: string | null;
  variant: BackVariant;
}) {
  if (variant === "correspondence") {
    return <CorrespondenceBack entry={entry} index={index} photo={photo} />;
  }
  return <TypedPerforated entry={entry} index={index} photo={photo} />;
}

function FlipCard({
  entry,
  index,
  photo,
  backVariant,
  showingBack,
  onToggle,
}: {
  entry: GuestEntry;
  index: number;
  photo: string;
  backVariant: BackVariant;
  showingBack: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="w-full max-w-3xl [filter:drop-shadow(0_24px_50px_rgba(0,0,0,0.32))]"
      style={{ perspective: "1600px" }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={
          showingBack
            ? "Show photo side of postcard"
            : "Show writing side of postcard"
        }
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
        className="relative aspect-[3/2] w-full cursor-pointer transition-transform duration-500 ease-[cubic-bezier(0.4,0.0,0.2,1)]"
        style={{
          transformStyle: "preserve-3d",
          transform: showingBack ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "translateZ(1px)",
          }}
        >
          <SouvenirFront entry={entry} photo={photo} />
        </div>
        {/* Back — pre-rotated so it faces outward when the shell hits 180° */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg) translateZ(1px)",
          }}
        >
          <BackFace
            entry={entry}
            index={index}
            photo={photo}
            variant={backVariant}
          />
        </div>
      </div>
    </div>
  );
}

export function PostcardPopout({
  entry,
  index,
  onClose,
}: {
  entry: GuestEntry;
  index: number;
  onClose: () => void;
}) {
  const photo = entry.photo_path ? photoPublicUrl(entry.photo_path) : null;
  const canFlip = Boolean(photo);
  const backVariant = backVariantFor(index);

  const [side, setSide] = useState<Side>(canFlip ? "front" : "back");
  const showingBack = !canFlip || side === "back";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggleSide() {
    if (!canFlip) return;
    setSide((current) => (current === "front" ? "back" : "front"));
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/55 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="relative flex min-h-full items-center justify-center px-4 py-10 sm:px-8 sm:py-12">
        <div className="fixed right-4 top-4 z-10 flex items-center gap-2 sm:right-6 sm:top-6">
          {canFlip ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleSide();
              }}
              className="rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-medium text-black/70 ring-1 ring-black/10 backdrop-blur hover:bg-white"
            >
              {showingBack ? "View photo" : "View other side"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-medium text-black/70 ring-1 ring-black/10 backdrop-blur hover:bg-white"
          >
            Close
          </button>
        </div>

        <motion.article
          role="dialog"
          aria-modal="true"
          aria-label={`Postcard from ${entry.name}`}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="relative flex w-full max-w-3xl justify-center"
          onClick={(event) => event.stopPropagation()}
        >
          {canFlip && photo ? (
            <FlipCard
              entry={entry}
              index={index}
              photo={photo}
              backVariant={backVariant}
              showingBack={showingBack}
              onToggle={toggleSide}
            />
          ) : (
            <div className="aspect-[3/2] w-full max-w-3xl [filter:drop-shadow(0_24px_50px_rgba(0,0,0,0.32))]">
              <BackFace
                entry={entry}
                index={index}
                photo={photo}
                variant={backVariant}
              />
            </div>
          )}
        </motion.article>
      </div>
    </motion.div>
  );
}
