import Link from "next/link";
import { getAllPostsAdmin } from "@/lib/posts";
import { PostList } from "@/components/studio/PostList";
import { signOutAction } from "@/app/studio/actions";

export default async function StudioPage() {
  const posts = await getAllPostsAdmin();

  return (
    <main className="min-h-dvh px-4 py-8 max-w-lg mx-auto">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="font-pixel text-[9px] text-chrome/40 mb-1">STUDIO</p>
          <h1 className="text-2xl font-semibold">Your moments</h1>
          <p className="text-sm text-chrome/50 mt-1">
            {posts.length} post{posts.length === 1 ? "" : "s"}
          </p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="metal-pill rounded-full px-3 py-2 text-xs text-ink"
          >
            Sign out
          </button>
        </form>
      </div>

      <Link
        href="/studio/new"
        className="accent-dial relative mb-6 flex items-center justify-center rounded-full py-4 text-ink font-semibold"
      >
        + New moment
      </Link>

      <PostList posts={posts} />

      <p className="mt-10 text-center text-xs text-chrome/30">
        <Link href="/" className="underline-offset-2 hover:underline">
          View public site
        </Link>
      </p>
    </main>
  );
}
