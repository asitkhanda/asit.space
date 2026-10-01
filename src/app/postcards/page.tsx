import { listGuestEntries } from "@/lib/guests";
import { PostcardWall } from "@/components/guest/PostcardWall";

export default async function PostcardsPage() {
  const entries = await listGuestEntries();

  return (
    <main className="min-h-dvh bg-[#e8e8ea] px-4 pb-10 pt-24 text-black md:px-10 md:pb-14 md:pt-28">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Guest postcards
            </h1>
            <p className="mt-3 max-w-xl text-sm text-black/55 md:text-base">
              Mini marks left by people who got a postcard at an event. Tap a card to open it.
            </p>
          </div>
          <p className="text-sm font-medium text-black/40">
            {entries.length} {entries.length === 1 ? "card" : "cards"}
          </p>
        </header>

        <PostcardWall entries={entries} />
      </div>
    </main>
  );
}
