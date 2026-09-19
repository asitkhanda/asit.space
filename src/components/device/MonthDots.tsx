"use client";

import Link from "next/link";
import { monthDotCells } from "@/lib/calendar";

export function MonthDots({
  year,
  month,
  postedDays,
  orientation = "grid",
}: {
  year: number;
  month: number;
  postedDays: Set<number>;
  orientation?: "grid" | "row";
}) {
  const days = monthDotCells(year, month);

  if (orientation === "row") {
    return (
      <Link
        href="/archive"
        className="calendar-plate flex h-full min-h-12 w-full items-center overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Open archive"
      >
        <div className="mx-auto flex w-max gap-2.5">
          {days.map((day) => {
            const filled = postedDays.has(day);
            return (
              <span
                key={day}
                className={`size-2 shrink-0 rounded-full ${
                  filled ? "bg-black" : "border border-black/50 bg-transparent"
                }`}
              />
            );
          })}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/archive"
      className="calendar-plate flex w-[140px] flex-col items-start p-[18px]"
      aria-label="Open archive — current month posts"
    >
      <div className="grid grid-cols-7 gap-x-2 gap-y-2.5">
        {days.map((day) => {
          const filled = postedDays.has(day);
          return (
            <span
              key={day}
              className={`size-2 rounded-full ${
                filled ? "bg-black" : "border border-black/50 bg-transparent"
              }`}
              title={`Day ${day}`}
            />
          );
        })}
      </div>
    </Link>
  );
}
