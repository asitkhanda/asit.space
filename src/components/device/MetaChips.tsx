"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Location01Icon } from "@hugeicons/core-free-icons";

export function DateChip({ label }: { label: string }) {
  return (
    <div className="meta-chip inline-flex w-full items-center justify-center px-6 py-2.5">
      <span className="text-base font-medium text-[#3a3a3a] mix-blend-luminosity whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

export function LocationChip({
  name,
  href,
}: {
  name: string;
  href?: string | null;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const check = () => {
      if (!wrapRef.current || !textRef.current) return;
      setOverflow(textRef.current.scrollWidth > wrapRef.current.clientWidth);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [name]);

  const content = (
    <div className="relative z-[1] flex w-full min-w-0 items-center gap-[5px] overflow-hidden">
      <span className="flex size-5 shrink-0 items-center justify-center text-[#3a3a3a] mix-blend-luminosity">
        <HugeiconsIcon
          icon={Location01Icon}
          size={18}
          strokeWidth={2}
          color="currentColor"
        />
      </span>
      <div ref={wrapRef} className="min-w-0 flex-1 overflow-hidden">
        {overflow ? (
          <div className="marquee-track gap-8">
            <span className="text-base font-medium text-[#3a3a3a] mix-blend-luminosity">
              {name}
            </span>
            <span
              className="text-base font-medium text-[#3a3a3a] mix-blend-luminosity"
              aria-hidden
            >
              {name}
            </span>
          </div>
        ) : (
          <span
            ref={textRef}
            className="text-base font-medium text-[#3a3a3a] mix-blend-luminosity whitespace-nowrap"
          >
            {name || "Somewhere"}
          </span>
        )}
      </div>
    </div>
  );

  const className =
    "meta-chip inline-flex w-full min-w-0 items-center px-3 py-2.5";

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className} title={name}>
        {content}
      </a>
    );
  }

  return (
    <div className={className} title={name}>
      {content}
    </div>
  );
}
