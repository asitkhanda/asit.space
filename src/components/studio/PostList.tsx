"use client";

import Image from "next/image";
import { useTransition } from "react";
import type { PostWithPeople } from "@/lib/types";
import { formatPostDate, photoPublicUrl } from "@/lib/format";
import {
  deletePostAction,
  togglePublishAction,
} from "@/app/studio/actions";

export function PostList({ posts }: { posts: PostWithPeople[] }) {
  const [pending, startTransition] = useTransition();

  if (!posts.length) {
    return (
      <p className="text-chrome/50 text-sm py-8 text-center">
        No moments yet. Post your first one.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {posts.map((post) => (
        <li
          key={post.id}
          className="metal-surface rounded-[24px] p-3 flex gap-3 items-center"
        >
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-screen">
            <Image
              src={photoPublicUrl(post.photo_path)}
              alt=""
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-pixel text-[9px] text-ink/60">
              {formatPostDate(post.occurred_at)}
            </p>
            <p className="text-sm font-medium text-ink truncate">
              {post.location_name || "Untitled"}
            </p>
            <p className="text-xs text-ink/50">
              {post.published ? "Published" : "Draft"} · {post.like_count} likes
            </p>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(() =>
                  togglePublishAction(post.id, !post.published),
                )
              }
              className="metal-pill rounded-full px-3 py-1.5 text-[11px] font-medium"
            >
              {post.published ? "Unpublish" : "Publish"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!confirm("Delete this moment?")) return;
                startTransition(() => deletePostAction(post.id));
              }}
              className="metal-pill rounded-full px-3 py-1.5 text-[11px] font-medium text-red-800"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
