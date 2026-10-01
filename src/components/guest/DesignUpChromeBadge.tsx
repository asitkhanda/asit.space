"use client";

import { SpecialChromeBadge } from "@/components/guest/SpecialChromeBadge";

type Props = {
  compact?: boolean;
  className?: string;
  title?: string;
  /** @deprecated Ignored — tooltip is fixed to the viewport and centered on the badge. */
  tooltipAlign?: "start" | "center" | "end";
};

export function DesignUpChromeBadge({
  compact = false,
  className = "",
  title = "DesignUp 2026",
}: Props) {
  return (
    <SpecialChromeBadge
      compact={compact}
      className={className}
      title={title}
      compactSrc="/badges/designup-2026-sm.png?v=7"
      largeSrc="/badges/designup-2026.png?v=7"
      compactBox="h-10 w-[39px] sm:h-11 sm:w-[43px]"
      largeBox="h-[76px] w-[74px] sm:h-[88px] sm:w-[86px]"
      compactSize={{ width: 222, height: 238 }}
      largeSize={{ width: 333, height: 357 }}
      shineClassName="designup-chrome-shine"
    />
  );
}
