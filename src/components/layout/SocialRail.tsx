"use client";

import type { SocialLink } from "@/lib/types";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  FigmaIcon,
  Linkedin01Icon,
  MagicWand01Icon,
  NewTwitterIcon,
  MailAtSign01Icon,
  File01Icon,
} from "@hugeicons/core-free-icons";

const iconMap: Record<SocialLink["icon"], IconSvgElement> = {
  portfolio: FigmaIcon,
  linkedin: Linkedin01Icon,
  ai: MagicWand01Icon,
  twitter: NewTwitterIcon,
  email: MailAtSign01Icon,
  blog: File01Icon,
};

export function SocialRail({ links }: { links: SocialLink[] }) {
  return (
    <nav className="flex flex-col gap-[9px] items-start" aria-label="Social links">
      {links.map((link) => {
        const icon = iconMap[link.icon];
        return (
          <a
            key={link.id}
            href={link.href}
            target={link.href.startsWith("mailto:") ? undefined : "_blank"}
            rel="noreferrer"
            className="social-pill inline-flex items-center gap-2 pl-3 pr-4 py-2.5 text-base font-medium whitespace-nowrap"
          >
            <HugeiconsIcon
              icon={icon}
              size={24}
              strokeWidth={1.5}
              color="currentColor"
              className="shrink-0"
            />
            <span>{link.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

export function MobileSocials({ links }: { links: SocialLink[] }) {
  const compact = links.filter((l) =>
    ["portfolio", "linkedin", "twitter", "blog"].includes(l.id),
  );

  return (
    <nav className="flex lg:hidden items-center gap-2" aria-label="Social links">
      {compact.map((link) => {
        const icon = iconMap[link.icon];
        return (
          <a
            key={link.id}
            href={link.href}
            target={link.href.startsWith("mailto:") ? undefined : "_blank"}
            rel="noreferrer"
            className="social-pill flex size-8 items-center justify-center rounded-full !px-0"
            aria-label={link.label}
          >
            <HugeiconsIcon
              icon={icon}
              size={16}
              strokeWidth={1.5}
              color="currentColor"
            />
          </a>
        );
      })}
    </nav>
  );
}
