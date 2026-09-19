"use client";

import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultipleIcon,
  Cancel01Icon,
  NewTwitterIcon,
} from "@hugeicons/core-free-icons";
import type { Person } from "@/lib/types";
import { twitterUrl } from "@/lib/format";

const NAME_COLORS = ["#e3a062", "#e3628b", "#62e3a7", "#e3d062", "#a062e3"];

function firstName(full: string) {
  return full.trim().split(/\s+/)[0] || full;
}

function PersonRow({ person, colorIndex }: { person: Person; colorIndex: number }) {
  const href = person.twitter_handle
    ? twitterUrl(person.twitter_handle)
    : person.linkedin_url;
  const color = NAME_COLORS[colorIndex % NAME_COLORS.length];
  const label = firstName(person.name);

  const nameClass =
    "person-name flex w-[146px] items-center overflow-hidden px-6 py-2.5 text-base font-medium";

  return (
    <div className="flex items-center gap-8">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className={nameClass}
          style={{ background: color }}
          title={person.name}
        >
          <span className="truncate">{label}</span>
        </a>
      ) : (
        <div className={nameClass} style={{ background: color }} title={person.name}>
          <span className="truncate">{label}</span>
        </div>
      )}
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="person-social flex size-10 shrink-0 items-center justify-center"
          aria-label={`${person.name} profile`}
        >
          <HugeiconsIcon
            icon={NewTwitterIcon}
            size={20}
            strokeWidth={1.5}
            color="currentColor"
          />
        </a>
      ) : (
        <span className="size-10 shrink-0" aria-hidden />
      )}
    </div>
  );
}

export function PeoplePanel({ people }: { people: Person[] }) {
  if (!people.length) return null;

  return (
    <aside className="people-card flex w-[277px] flex-col gap-6 px-8 py-6">
      <h2 className="text-2xl font-medium text-black leading-tight">
        People in this photo
      </h2>
      <div className="flex flex-col gap-2">
        {people.map((person, i) => (
          <PersonRow key={person.id} person={person} colorIndex={i} />
        ))}
      </div>
    </aside>
  );
}

export function PeopleSheetTrigger({
  people,
  open,
  onOpenChange,
}: {
  people: Person[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!people.length) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="social-pill inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium lg:hidden"
      >
        <span>People in this photo</span>
        <HugeiconsIcon
          icon={UserMultipleIcon}
          size={16}
          strokeWidth={1.5}
          color="currentColor"
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="people-card absolute bottom-0 inset-x-0 rounded-t-[28px] rounded-b-none p-5 pb-10"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-black">
                  People in this photo
                </h2>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="meta-chip flex size-9 items-center justify-center rounded-full"
                  aria-label="Close people"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={16}
                    strokeWidth={2}
                    color="currentColor"
                  />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {people.map((person, i) => (
                  <PersonRow key={person.id} person={person} colorIndex={i} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
