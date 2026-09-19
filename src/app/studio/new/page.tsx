import Link from "next/link";
import { ComposeForm } from "./ComposeForm";

export default function StudioNewPage() {
  return (
    <main className="min-h-dvh px-4 py-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-pixel text-[9px] text-chrome/40 mb-1">STUDIO</p>
          <h1 className="text-2xl font-semibold">New moment</h1>
        </div>
        <Link
          href="/studio"
          className="metal-pill rounded-full px-4 py-2 text-sm text-ink"
        >
          Back
        </Link>
      </div>
      <ComposeForm />
    </main>
  );
}
