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
      compactBox="h-7 w-[27px] sm:h-8 sm:w-[31px]"
      largeBox="h-[52px] w-[51px] sm:h-[60px] sm:w-[58px]"
      compactSize={{ width: 222, height: 238 }}
      largeSize={{ width: 333, height: 357 }}
      shineClassName="designup-chrome-shine"
    />
  );
}
