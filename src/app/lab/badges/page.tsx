"use client";

import { ConfigBadge } from "@/components/guest/ConfigBadge";
import { DesignUpChromeBadge } from "@/components/guest/DesignUpChromeBadge";

const SAMPLE_PHOTO =
  "data:image/svg+xml," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6b6358"/>
      <stop offset="55%" stop-color="#3d3832"/>
      <stop offset="100%" stop-color="#1f1c19"/>
    </linearGradient>
  </defs>
  <rect width="640" height="480" fill="url(#g)"/>
  <circle cx="460" cy="140" r="80" fill="#c4b49a" opacity="0.35"/>
  <rect x="48" y="330" width="300" height="14" rx="2" fill="#f2ebe0" opacity="0.22"/>
  <rect x="48" y="360" width="200" height="10" rx="2" fill="#f2ebe0" opacity="0.14"/>
</svg>`);

export default function BadgeLabPage() {
  return (
    <main className="min-h-full bg-[#f3efe6] px-4 pb-20 pt-24 text-black sm:px-6 md:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/40">
          Lab · not linked from nav
        </p>
        <h1 className="mt-2 font-postcard-serif text-3xl font-bold tracking-tight text-black sm:text-4xl">
          Special-day badges
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/55">
          Guest postcards get a special mark from their entry timestamp.
          Printed QR codes stay the same.
        </p>

        {/* DesignUp */}
        <section className="mt-12">
          <h2 className="font-postcard-serif text-2xl font-bold text-black">
            DesignUp 2026
          </h2>
          <p className="mt-1 text-sm text-black/55">
            Window: 2–4 Oct 2026 (Asia/Kolkata)
          </p>

          <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:items-center">
            <div className="stamp-perforation !p-2 shadow-[0_18px_40px_rgba(0,0,0,0.14)]">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#2a2a2c]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={SAMPLE_PHOTO}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <DesignUpChromeBadge
                  className="!bottom-auto !right-5 !top-5"
                  tooltipAlign="end"
                />
                <p className="font-postcard-script absolute inset-x-4 bottom-5 text-center text-4xl leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
                  Bengaluru
                </p>
              </div>
            </div>

            <div>
              <div className="relative mt-2 flex h-28 items-center justify-start">
                <DesignUpChromeBadge className="!relative !inset-auto !h-28 !w-[109px]" />
              </div>
              <ul className="mt-6 space-y-1.5 text-sm text-black/55">
                <li>Trigger: guest entry created_at</li>
                <li>Surfaces: postcard wall + open postcard</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 max-w-[156px]">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/40">
              Wall scale
            </p>
            <div className="stamp-perforation mt-3 !p-1 shadow-[0_8px_18px_rgba(0,0,0,0.12)]">
              <div className="relative aspect-[3/4] overflow-hidden bg-[#2a2a2c]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={SAMPLE_PHOTO}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <DesignUpChromeBadge
                  compact
                  tooltipAlign="start"
                  className="!bottom-auto !left-2.5 !right-auto !top-2.5"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-2 pb-2 pt-8">
                  <p className="text-[11px] font-semibold text-white">Indiranagar</p>
                  <p className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.12em] text-white/75">
                    Guest · OCT 3
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Config */}
        <section className="mt-16 border-t border-black/10 pt-12">
          <h2 className="font-postcard-serif text-2xl font-bold text-black">
            Config 2026
          </h2>
          <p className="mt-1 text-sm text-black/55">
            Window: 15 Oct 2026 (Asia/Kolkata) · Config India · flat brand colors
          </p>

          <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:items-center">
            <div className="stamp-perforation !p-2 shadow-[0_18px_40px_rgba(0,0,0,0.14)]">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#2a2a2c]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={SAMPLE_PHOTO}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <ConfigBadge
                  className="!bottom-auto !right-4 !top-4"
                  tooltipAlign="end"
                />
                <p className="font-postcard-script absolute inset-x-4 bottom-5 text-center text-4xl leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
                  Bengaluru
                </p>
              </div>
            </div>

            <div>
              <div className="relative mt-2 flex h-16 items-center justify-start">
                <ConfigBadge className="!relative !inset-auto !h-10 !w-[200px]" />
              </div>
              <ul className="mt-6 space-y-1.5 text-sm text-black/55">
                <li>Palette: #24CB71 #E4FF97 #00B6FF #4D49FC #CB9FD2 #FF3737</li>
                <li>Trigger: guest entry created_at</li>
                <li>Surfaces: postcard wall + open postcard</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 max-w-[156px]">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/40">
              Wall scale
            </p>
            <div className="stamp-perforation mt-3 !p-1 shadow-[0_8px_18px_rgba(0,0,0,0.12)]">
              <div className="relative aspect-[3/4] overflow-hidden bg-[#2a2a2c]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={SAMPLE_PHOTO}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <ConfigBadge
                  compact
                  tooltipAlign="start"
                  className="!bottom-auto !left-1.5 !right-auto !top-2"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-2 pb-2 pt-8">
                  <p className="text-[11px] font-semibold text-white">Indiranagar</p>
                  <p className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.12em] text-white/75">
                    Guest · OCT 15
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
