"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { useSiteChrome } from "./SiteChromeContext";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/postcards", label: "Namaste" },
  { href: "https://asit.design", label: "Portfolio", external: true },
  { href: "https://asit.blog", label: "Blog", external: true },
  { href: "https://asit.work", label: "AI", external: true },
] as const;

function linkIsActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinkItems({
  pathname,
  onNavigate,
  layout,
}: {
  pathname: string;
  onNavigate?: () => void;
  layout: "row" | "stack";
}) {
  const stacked = layout === "stack";

  return (
    <>
      {NAV_LINKS.map((link) => {
        const base = stacked
          ? "flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors"
          : "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors";

        if ("external" in link && link.external) {
          return (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              onClick={onNavigate}
              className={`${base} text-black/55 hover:bg-black/5 hover:text-black`}
            >
              {link.label}
              {stacked ? (
                <span aria-hidden className="text-black/25">
                  ↗
                </span>
              ) : null}
            </a>
          );
        }

        const active = linkIsActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`${base} ${
              active
                ? stacked
                  ? "bg-black text-white"
                  : "bg-black text-white"
                : "text-black/55 hover:bg-black/5 hover:text-black"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

export function SiteFloatingNav() {
  const pathname = usePathname();
  const { placeName, weather, mapsUrl, onDarkSurface } = useSiteChrome();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);

  // Map chrome only — guest/postcard pages have no place to navigate to.
  const isMapHome = pathname === "/";
  const canNavigate = isMapHome && Boolean(mapsUrl);
  const showNavigateCluster = isMapHome;
  const subtle = onDarkSurface ? "text-white/55" : "text-black/45";
  const subtleStrong = onDarkSurface ? "text-white/75" : "text-black/60";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] p-3 sm:p-4 md:p-5">
      <div className="mx-auto flex max-w-[1600px] items-start justify-between gap-3">
        <div ref={menuRef} className="pointer-events-auto relative min-w-0">
          {/* Desktop — full link row */}
          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 rounded-full bg-white/90 px-2 py-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/5 backdrop-blur-xl md:inline-flex"
          >
            <Link
              href="/"
              className="mr-1 inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold tracking-tight text-black"
            >
              Hey There!
            </Link>
            <NavLinkItems pathname={pathname} layout="row" />
          </nav>

          {/* Mobile — brand + menu */}
          <div className="md:hidden">
            <div className="inline-flex max-w-full items-center gap-0.5 rounded-full bg-white/90 py-1 pl-2 pr-1 shadow-[0_10px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/5 backdrop-blur-xl">
              <Link
                href="/"
                className="inline-flex items-center truncate rounded-full px-2.5 py-1.5 text-sm font-semibold tracking-tight text-black"
              >
                Hey There!
              </Link>
              <button
                type="button"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((open) => !open)}
                className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                  menuOpen
                    ? "bg-black text-white"
                    : "text-black/55 hover:bg-black/5 hover:text-black"
                }`}
              >
                <HugeiconsIcon
                  icon={menuOpen ? Cancel01Icon : Menu01Icon}
                  size={18}
                  strokeWidth={2}
                />
              </button>
            </div>

            {menuOpen ? (
              <nav
                id={menuId}
                aria-label="Primary"
                className="absolute left-0 top-full z-10 mt-2 w-[min(calc(100vw-1.5rem),14rem)] rounded-2xl bg-white/95 p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.16)] ring-1 ring-black/5 backdrop-blur-xl"
              >
                <NavLinkItems
                  pathname={pathname}
                  layout="stack"
                  onNavigate={() => setMenuOpen(false)}
                />
              </nav>
            ) : null}
          </div>
        </div>

        {/* Right — navigate + subtle weather/place (map chrome only) */}
        {showNavigateCluster ? (
          <div className="pointer-events-auto flex max-w-[min(100%,11.5rem)] shrink-0 flex-col items-end gap-1.5 sm:max-w-[min(100%,280px)] sm:gap-2">
            {canNavigate ? (
              <a
                href={mapsUrl!}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1c1c1c] px-3.5 py-2 text-sm font-medium text-white shadow-[0_10px_40px_rgba(0,0,0,0.2)] transition-opacity hover:opacity-90 sm:gap-2 sm:px-4 sm:py-2.5"
              >
                <span className="sm:hidden">Navigate</span>
                <span className="hidden sm:inline">Navigate to location</span>
                <span aria-hidden className="text-white/50">
                  ↗
                </span>
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1c1c1c]/40 px-3.5 py-2 text-sm font-medium text-white/50 ring-1 ring-white/10 backdrop-blur-md sm:gap-2 sm:px-4 sm:py-2.5">
                <span className="sm:hidden">Navigate</span>
                <span className="hidden sm:inline">Navigate to location</span>
              </span>
            )}

            <div
              className={`hidden px-1 text-right text-[11px] leading-snug tracking-wide sm:block ${subtle}`}
              aria-live="polite"
            >
              {placeName ? (
                <p className={`font-medium ${subtleStrong}`}>{placeName}</p>
              ) : null}
              {weather?.status === "ready" ? (
                <p className="mt-0.5">
                  {Math.round(weather.tempC)}° · {weather.mood}
                </p>
              ) : weather?.status === "loading" ? (
                <p className="mt-0.5">Checking sky…</p>
              ) : placeName ? (
                <p className="mt-0.5 opacity-70">Sky quiet</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div aria-hidden className="w-0" />
        )}
      </div>
    </div>
  );
}
