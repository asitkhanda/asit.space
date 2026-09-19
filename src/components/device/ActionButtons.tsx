"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUp01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

export function NavChevrons({
  axis,
  canGoNewer,
  canGoOlder,
  onNewer,
  onOlder,
}: {
  axis: "vertical" | "horizontal";
  canGoNewer: boolean;
  canGoOlder: boolean;
  onNewer: () => void;
  onOlder: () => void;
}) {
  if (axis === "vertical") {
    return (
      <div className="flex w-[97px] flex-col gap-0.5">
        <button
          type="button"
          onClick={onNewer}
          disabled={!canGoNewer}
          aria-label="Newer post"
          className="chevron-btn chevron-btn-up flex h-[97px] w-full items-center justify-center"
        >
          <HugeiconsIcon
            icon={ArrowUp01Icon}
            size={40}
            strokeWidth={2.5}
            color="currentColor"
          />
        </button>
        <button
          type="button"
          onClick={onOlder}
          disabled={!canGoOlder}
          aria-label="Older post"
          className="chevron-btn chevron-btn-down flex h-[97px] w-full items-center justify-center"
        >
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={40}
            strokeWidth={2.5}
            color="currentColor"
          />
        </button>
      </div>
    );
  }

  // Mobile / tablet: shared metal fill, pill rocker — do NOT use up/down radius classes
  return (
    <div className="flex shrink-0">
      <button
        type="button"
        onClick={onNewer}
        disabled={!canGoNewer}
        aria-label="Newer post"
        className="chevron-btn chevron-btn-h-left flex size-12 md:size-14 items-center justify-center disabled:opacity-35 disabled:pointer-events-none"
      >
        <HugeiconsIcon
          icon={ArrowLeft01Icon}
          size={24}
          strokeWidth={2.5}
          color="currentColor"
        />
      </button>
      <button
        type="button"
        onClick={onOlder}
        disabled={!canGoOlder}
        aria-label="Older post"
        className="chevron-btn chevron-btn-h-right -ml-px flex size-12 md:size-14 items-center justify-center disabled:opacity-35 disabled:pointer-events-none"
      >
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={24}
          strokeWidth={2.5}
          color="currentColor"
        />
      </button>
    </div>
  );
}
