"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { PostWithPeople } from "@/lib/types";
import { formatPostDate, photoPublicUrl } from "@/lib/format";
import { getPostedDaysInMonth } from "@/lib/calendar";
import { SOCIAL_LINKS } from "@/lib/socials";
import { SocialRail, MobileSocials } from "@/components/layout/SocialRail";
import { DateChip, LocationChip } from "@/components/device/MetaChips";
import { MonthDots } from "@/components/device/MonthDots";
import { NavChevrons } from "@/components/device/ActionButtons";
import {
  LikeButton,
  QrButton,
} from "@/components/device/ActionButtonsExtras";
import {
  PeoplePanel,
  PeopleSheetTrigger,
} from "@/components/device/PeoplePanel";
import { PostPhoto } from "@/components/device/PostPhoto";

gsap.registerPlugin(useGSAP);

const DESKTOP_FRAME_W = 1440;
const DESKTOP_FRAME_H = 1024;
const DESKTOP_PAD = 24;

type LikedMap = Record<string, boolean>;

function useDesktopStageScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function update() {
      const mq = window.matchMedia("(min-width: 1024px)");
      if (!mq.matches) {
        setScale(1);
        return;
      }
      const next = Math.min(
        1,
        (window.innerWidth - DESKTOP_PAD * 2) / DESKTOP_FRAME_W,
        (window.innerHeight - DESKTOP_PAD * 2) / DESKTOP_FRAME_H,
      );
      setScale(next);
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return scale;
}

export function TimelineDevice({
  posts,
  initialIndex,
  likedMap,
}: {
  posts: PostWithPeople[];
  initialIndex: number;
  likedMap: LikedMap;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(initialIndex);
  const [booted, setBooted] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const stageScale = useDesktopStageScale();

  const post = posts[index] ?? null;
  const canGoNewer = index > 0;
  const canGoOlder = index < posts.length - 1 && posts.length > 0;
  const people = post?.people ?? [];

  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const postedDays = useMemo(
    () => getPostedDaysInMonth(posts, year, month),
    [posts, year, month],
  );

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= posts.length) return;
      setIndex(next);
      const id = posts[next]?.id;
      if (id) {
        router.replace(`/?p=${id}`, { scroll: false });
      }
    },
    [posts, router],
  );

  const goNewer = useCallback(() => {
    if (canGoNewer) goTo(index - 1);
  }, [canGoNewer, goTo, index]);

  const goOlder = useCallback(() => {
    if (canGoOlder) goTo(index + 1);
  }, [canGoOlder, goTo, index]);

  useGSAP(
    () => {
      if (!rootRef.current) return;
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReduced) {
        setBooted(true);
        return;
      }

      const tl = gsap.timeline({
        onComplete: () => setBooted(true),
      });

      tl.fromTo(
        "[data-boot='chassis']",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" },
      ).fromTo(
        "[data-boot='chrome']",
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.04 },
        "-=0.25",
      );
    },
    { scope: rootRef },
  );

  useGSAP(
    () => {
      if (!booted || !screenRef.current) return;
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (prefersReduced) return;

      gsap.fromTo(
        screenRef.current,
        { opacity: 0.4, y: 8 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
      );
    },
    { dependencies: [index, booted], scope: rootRef },
  );

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    function syncOverflow() {
      document.documentElement.style.overflow = desktop.matches
        ? "hidden"
        : "";
      document.body.style.overflow = desktop.matches ? "hidden" : "";
    }
    syncOverflow();
    desktop.addEventListener("change", syncOverflow);
    return () => {
      desktop.removeEventListener("change", syncOverflow);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  const dateLabel = post ? formatPostDate(post.occurred_at) : "-- --- ----";
  const locationName = post?.location_name || "Location";

  return (
    <div
      ref={rootRef}
      className="relative min-h-dvh w-full bg-stage text-ink lg:h-dvh lg:overflow-hidden"
    >
      {/* Mobile / tablet layout */}
      <div className="lg:hidden px-4 py-6 md:px-10">
        <header
          data-boot="chrome"
          className="flex items-center justify-between gap-4 mb-6"
        >
          <h1 className="text-[30px] md:text-[40px] font-semibold tracking-tight text-black">
            HEY THERE!
          </h1>
          <MobileSocials links={SOCIAL_LINKS} />
        </header>

        <div className="flex w-full max-w-[734px] mx-auto flex-col gap-3 md:gap-4">
          <div data-boot="chassis" className="device-chassis relative p-4 md:p-6">
            <div
              ref={screenRef}
              className="device-screen relative aspect-[3/4] w-full"
              onContextMenu={(e) => e.preventDefault()}
            >
              {post ? (
                <PostPhoto
                  src={photoPublicUrl(post.photo_path)}
                  alt={post.location_name || "Event photo"}
                  priority
                  className="object-cover"
                  sizes="90vw"
                />
              ) : (
                <EmptyScreen />
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-2">
                <DateChip label={dateLabel} />
                <LocationChip name={locationName} href={post?.maps_url} />
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <NavChevrons
                  axis="horizontal"
                  canGoNewer={canGoNewer}
                  canGoOlder={canGoOlder}
                  onNewer={goNewer}
                  onOlder={goOlder}
                />
                <QrButton />
              </div>
            </div>
          </div>

          <div className="flex items-stretch justify-between gap-3">
            <div className="min-w-0 flex-1 overflow-hidden">
              <MonthDots
                year={year}
                month={month}
                postedDays={postedDays}
                orientation="row"
              />
            </div>
            <PeopleSheetTrigger
              people={people}
              open={peopleOpen}
              onOpenChange={setPeopleOpen}
            />
          </div>
        </div>
      </div>

      {/*
        Desktop: Figma 1440×1024 stage, uniformly scaled to fit the viewport.
        Device stays at left 353 — people at 1116 only when tagged (no shift).
      */}
      <div className="hidden lg:flex h-dvh w-full items-center justify-center overflow-hidden">
        <div
          style={{
            width: DESKTOP_FRAME_W * stageScale,
            height: DESKTOP_FRAME_H * stageScale,
          }}
        >
          <div
            className="relative origin-top-left"
            style={{
              width: DESKTOP_FRAME_W,
              height: DESKTOP_FRAME_H,
              transform: `scale(${stageScale})`,
            }}
          >
            <h1
              data-boot="chrome"
              className="absolute left-[80px] top-[48px] text-[40px] font-semibold leading-none text-black whitespace-nowrap"
            >
              HEY THERE!
            </h1>

            <div data-boot="chrome" className="absolute left-[80px] top-[128px]">
              <SocialRail links={SOCIAL_LINKS} />
            </div>

            <div
              data-boot="chassis"
              className="device-chassis absolute left-[353px] top-[128px] h-[770px] w-[734px]"
            >
              <div
                ref={screenRef}
                className="device-screen absolute left-6 top-6 z-[1] h-[721px] w-[506px]"
                onContextMenu={(e) => e.preventDefault()}
              >
                {post ? (
                  <PostPhoto
                    src={photoPublicUrl(post.photo_path)}
                    alt={post.location_name || "Event photo"}
                    priority
                    className="object-cover"
                    sizes="506px"
                  />
                ) : (
                  <EmptyScreen />
                )}
              </div>

              <div className="absolute left-[561px] top-6 z-[1] flex w-[146px] flex-col gap-2">
                <DateChip label={dateLabel} />
                <LocationChip name={locationName} href={post?.maps_url} />
              </div>

              <div
                className="device-divider absolute left-[530px] top-[177px] z-[1] !w-[203px]"
                aria-hidden
              />
              <div
                className="device-divider absolute left-[530px] top-[587px] z-[1] !w-[203px]"
                aria-hidden
              />

              <div className="absolute left-[585px] top-[219px] z-[1]">
                <NavChevrons
                  axis="vertical"
                  canGoNewer={canGoNewer}
                  canGoOlder={canGoOlder}
                  onNewer={goNewer}
                  onOlder={goOlder}
                />
              </div>

              <div className="absolute left-[585px] top-[455px] z-[1]">
                {post ? (
                  <LikeButton
                    postId={post.id}
                    initialCount={post.like_count}
                    initiallyLiked={Boolean(likedMap[post.id])}
                  />
                ) : (
                  <div className="heart-dial size-[97px] rounded-full opacity-40" />
                )}
              </div>

              <div className="absolute left-[564px] top-[627px] z-[1]">
                <MonthDots
                  year={year}
                  month={month}
                  postedDays={postedDays}
                  orientation="grid"
                />
              </div>
            </div>

            {people.length > 0 ? (
              <div
                data-boot="chrome"
                className="absolute left-[1116px] top-[128px]"
              >
                <PeoplePanel people={people} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyScreen() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-[#1a1a1a]">
      <p className="font-pixel text-[10px] text-white/60">NO SIGNAL</p>
      <p className="text-sm text-white/40 max-w-[220px]">
        Moments will appear here once posted.
      </p>
    </div>
  );
}
