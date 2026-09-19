import Link from "next/link";
import { getPublishedPosts, groupPostsByMonth } from "@/lib/posts";
import { formatArchiveMonth, formatPostDate, photoPublicUrl } from "@/lib/format";
import { PostPhoto } from "@/components/device/PostPhoto";

export default async function ArchivePage() {
  const posts = await getPublishedPosts();
  const groups = groupPostsByMonth(posts);

  return (
    <main className="min-h-dvh px-4 py-8 md:px-10 md:py-12 max-w-5xl mx-auto bg-stage text-ink">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="font-pixel text-[9px] text-ink/40 mb-2">ARCHIVE</p>
          <h1 className="text-3xl md:text-4xl font-semibold">Month view</h1>
          <p className="text-sm text-ink/50 mt-2">
            Year and decade zoom come later.
          </p>
        </div>
        <Link
          href="/"
          className="social-pill rounded-full px-4 py-2.5 text-sm"
        >
          Back to device
        </Link>
      </div>

      {!groups.length ? (
        <p className="text-ink/50">No published moments yet.</p>
      ) : (
        <div className="flex flex-col gap-12">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="font-pixel text-xs text-accent mb-4">
                {formatArchiveMonth(group.year, group.month)}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                {group.posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/?p=${post.id}`}
                    className="people-card group overflow-hidden !rounded-[20px]"
                  >
                    <div className="relative aspect-square bg-[#111]">
                      <PostPhoto
                        src={photoPublicUrl(post.photo_path)}
                        alt={post.location_name}
                        className="object-cover transition-transform group-hover:scale-[1.03]"
                        sizes="(max-width: 768px) 45vw, 200px"
                      />
                    </div>
                    <div className="p-3">
                      <p className="font-pixel text-[8px] text-ink/55">
                        {formatPostDate(post.occurred_at)}
                      </p>
                      <p className="text-sm text-ink font-medium truncate mt-1">
                        {post.location_name || "Somewhere"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
