"use client";

/**
 * Renders the special-day badge for a guest entry, if any.
 * Currently: DesignUp chrome badge for Bengaluru Oct 2–4, 2026 (IST).
 */

import { DesignUpChromeBadge } from "@/components/guest/DesignUpChromeBadge";
import { badgeForCreatedAt } from "@/lib/guest-badges";

export function GuestSpecialBadge({
  createdAt,
  compact = false,
  className = "",
  tooltipAlign = "center",
}: {
  createdAt: string;
  compact?: boolean;
  className?: string;
  tooltipAlign?: "start" | "center" | "end";
}) {
  const badge = badgeForCreatedAt(createdAt);
  if (!badge) return null;

  if (badge.id === "designup-2026") {
    return (
      <DesignUpChromeBadge
        compact={compact}
        className={className}
        title={badge.label}
        tooltipAlign={tooltipAlign}
      />
    );
  }

  return null;
}
