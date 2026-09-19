"use client";

import Image from "next/image";
import type { SyntheticEvent } from "react";

const protectClass =
  "select-none [-webkit-user-drag:none] [-webkit-touch-callout:none]";

function blockSave(e: SyntheticEvent) {
  e.preventDefault();
}

export function PostPhoto({
  src,
  alt,
  className,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const isLocal = src.startsWith("/");
  const merged = `${protectClass} ${className ?? "object-cover"}`;

  if (isLocal) {
    return (
      // Local demo assets / SVGs — avoid next/image optimizer quirks
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        draggable={false}
        onContextMenu={blockSave}
        onDragStart={blockSave}
        className={`absolute inset-0 h-full w-full object-cover ${merged}`}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      draggable={false}
      onContextMenu={blockSave}
      onDragStart={blockSave}
      className={merged}
      sizes={sizes}
    />
  );
}
