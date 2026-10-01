"use client";

/**
 * Renders the special-day badge for a guest entry, if any.
 * DesignUp: Bengaluru Oct 2–4, 2026 (IST) — chrome mark
 * Config: Oct 15, 2026 (IST) — flat Config brand colors
 */

import { ConfigBadge } from "@/components/guest/ConfigBadge";
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

  if (badge.id === "config-2026") {
    return (
      <ConfigBadge
        compact={compact}
        className={className}
        title={badge.label}
        tooltipAlign={tooltipAlign}
      />
    );
  }

  return null;
}
