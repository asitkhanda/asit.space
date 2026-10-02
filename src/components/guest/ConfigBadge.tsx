"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  compact?: boolean;
  className?: string;
  title?: string;
  /** @deprecated Ignored — tooltip is fixed to the viewport and centered on the badge. */
  tooltipAlign?: "start" | "center" | "end";
};

const VIEW_PAD = 10;

/**
 * Flat multi-color Config wordmark (Config 2026 brand palette).
 * Tooltip renders in a body portal so postcard overflow cannot clip it.
 */
export function ConfigBadge({
  compact = false,
  className = "",
  title = "Config 2026",
}: Props) {
  const box = compact
    ? "h-2.5 w-[52px] sm:h-3 sm:w-[60px]"
    : "h-6 w-[130px] sm:h-7 sm:w-[148px]";
  const src = compact
    ? "/badges/config-2026-sm.png?v=3"
    : "/badges/config-2026.png?v=3";
  const size = compact
    ? { width: 540, height: 107 }
    : { width: 900, height: 179 };

  const tipId = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    left: number;
    top: number;
    transform: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const placeTooltip = useCallback(() => {
    const anchor = anchorRef.current;
    const tip = tipRef.current;
    if (!anchor || !tip) return;

    const rect = anchor.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const tipW = tipRect.width || 120;
    const tipH = tipRect.height || 28;

    const centerX = rect.left + rect.width / 2;
    const spaceAbove = rect.top;
    const placeAbove = spaceAbove >= tipH + VIEW_PAD + 4;

    let left = centerX;
    const minCenter = VIEW_PAD + tipW / 2;
    const maxCenter = window.innerWidth - VIEW_PAD - tipW / 2;
    left = Math.min(maxCenter, Math.max(minCenter, left));

    const top = placeAbove ? rect.top - VIEW_PAD : rect.bottom + VIEW_PAD;
    const transform = placeAbove
      ? "translate(-50%, -100%)"
      : "translate(-50%, 0)";

    setCoords({ left, top, transform });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    placeTooltip();
  }, [open, placeTooltip]);

  useEffect(() => {
    if (!open) return;
    const onReposition = () => placeTooltip();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, placeTooltip]);

  return (
    <>
      <span
        ref={anchorRef}
        className={`pointer-events-auto absolute z-10 ${box} ${className}`}
        aria-label={title}
        aria-describedby={open ? tipId : undefined}
        role="img"
        tabIndex={0}
        onClick={(event) => event.stopPropagation()}
        onPointerEnter={() => setOpen(true)}
        onPointerLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <span className="relative block h-full w-full [filter:drop-shadow(0_4px_8px_rgba(0,0,0,0.35))_drop-shadow(0_1px_2px_rgba(0,0,0,0.25))]">
          <img
            src={src}
            alt=""
            width={size.width}
            height={size.height}
            decoding="async"
            className="relative z-0 h-full w-full object-contain"
            draggable={false}
          />
        </span>
      </span>

      {mounted && open
        ? createPortal(
            <span
              ref={tipRef}
              id={tipId}
              role="tooltip"
              className="pointer-events-none fixed z-[9999] whitespace-nowrap rounded-md bg-[#1c1c1c] px-2.5 py-1 text-[11px] font-medium tracking-wide text-white shadow-[0_10px_28px_rgba(0,0,0,0.35)]"
              style={{
                left: coords?.left ?? -9999,
                top: coords?.top ?? -9999,
                transform: coords?.transform ?? "translate(-50%, -100%)",
                visibility: coords ? "visible" : "hidden",
              }}
            >
              {title}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
