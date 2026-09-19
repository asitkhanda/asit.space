import { daysInMonth } from "@/lib/format";
import type { Post } from "@/lib/types";

export function getPostedDaysInMonth(
  posts: Pick<Post, "occurred_at">[],
  year: number,
  month: number,
): Set<number> {
  const days = new Set<number>();
  posts.forEach((post) => {
    const d = new Date(post.occurred_at);
    if (d.getFullYear() === year && d.getMonth() + 1 === month) {
      days.add(d.getDate());
    }
  });
  return days;
}

export function monthDotCells(year: number, month: number) {
  const total = daysInMonth(year, month);
  return Array.from({ length: total }, (_, i) => i + 1);
}
