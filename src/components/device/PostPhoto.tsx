"use client";

import Image from "next/image";

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

  if (isLocal) {
    return (
      // Local demo assets / SVGs — avoid next/image optimizer quirks
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={`absolute inset-0 h-full w-full object-cover ${className ?? ""}`} />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      className={className ?? "object-cover"}
      sizes={sizes}
    />
  );
}
