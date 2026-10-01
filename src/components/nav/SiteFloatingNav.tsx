"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSiteChrome } from "./SiteChromeContext";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/postcards", label: "Namaste" },
  { href: "https://asit.design", label: "Portfolio", external: true },
  { href: "https://asit.blog", label: "Blog", external: true },
  { href: "https://asit.work", label: "AI", external: true },
] as const;

export function SiteFloatingNav() {
  const pathname = usePathname();
  const { placeName, weather, mapsUrl, onDarkSurface } = useSiteChrome();

  // Map chrome only — guest/postcard pages have no place to navigate to.
  const isMapHome = pathname === "/";
  const canNavigate = isMapHome && Boolean(mapsUrl);
  const showNavigateCluster = isMapHome;
  const subtle = onDarkSurface ? "text-white/55" : "text-black/45";
  const subtleStrong = onDarkSurface ? "text-white/75" : "text-black/60";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] p-4 md:p-5">
      <div className="mx-auto flex max-w-[1600px] items-start justify-between gap-4">
        {/* Left pill — primary destinations */}
        <nav
          aria-label="Primary"
          className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/5 backdrop-blur-xl"
        >
          <Link
            href="/"
            className="mr-1 inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold tracking-tight text-black"
          >
            Hey There!
          </Link>
          {NAV_LINKS.map((link) => {
            const className =
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors text-black/55 hover:bg-black/5 hover:text-black";

            if ("external" in link && link.external) {
              return (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={className}
                >
                  {link.label}
                </a>
              );
            }

            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-black text-white"
                    : "text-black/55 hover:bg-black/5 hover:text-black"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right — navigate + subtle weather/place (map chrome only) */}
        {showNavigateCluster ? (
          <div className="pointer-events-auto flex max-w-[min(100%,280px)] flex-col items-end gap-2">
            {canNavigate ? (
              <a
                href={mapsUrl!}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#1c1c1c] px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_40px_rgba(0,0,0,0.2)] transition-opacity hover:opacity-90"
              >
                Navigate to location
                <span aria-hidden className="text-white/50">
                  ↗
                </span>
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#1c1c1c]/40 px-4 py-2.5 text-sm font-medium text-white/50 ring-1 ring-white/10 backdrop-blur-md">
                Navigate to location
              </span>
            )}

            <div
              className={`px-1 text-right text-[11px] leading-snug tracking-wide ${subtle}`}
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
