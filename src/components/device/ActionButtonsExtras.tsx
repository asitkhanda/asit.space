"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon, QrCodeIcon } from "@hugeicons/core-free-icons";

export function LikeButton({
  postId,
  initialCount,
  initiallyLiked,
}: {
  postId: string;
  initialCount: number;
  initiallyLiked: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initiallyLiked);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(false);

  useEffect(() => {
    setCount(initialCount);
    setLiked(initiallyLiked);
  }, [postId, initialCount, initiallyLiked]);

  async function onLike() {
    if (liked || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (res.ok) {
        setLiked(true);
        if (typeof data.likeCount === "number") {
          setCount(data.likeCount);
          setTick(true);
          setTimeout(() => setTick(false), 400);
        } else {
          setCount((c) => c + 1);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onLike}
      disabled={liked || busy}
      aria-label={
        liked
          ? `Liked — ${count} ${count === 1 ? "like" : "likes"}`
          : `Like this moment — ${count} ${count === 1 ? "like" : "likes"}`
      }
      title={`${count} ${count === 1 ? "like" : "likes"}`}
      className={`heart-dial relative flex size-[97px] items-center justify-center rounded-full disabled:opacity-90 ${
        tick ? "scale-95" : ""
      }`}
    >
      <HugeiconsIcon
        icon={FavouriteIcon}
        size={40}
        strokeWidth={2.5}
        color="currentColor"
        className={`relative z-10 ${liked ? "fill-current" : ""}`}
      />
    </button>
  );
}

export function QrButton() {
  return (
    <button
      type="button"
      aria-label="QR scanner — coming soon"
      className="chevron-btn chevron-btn-round flex size-12 md:size-14 shrink-0 items-center justify-center active:scale-95"
    >
      <HugeiconsIcon
        icon={QrCodeIcon}
        size={22}
        strokeWidth={2}
        color="currentColor"
      />
    </button>
  );
}
