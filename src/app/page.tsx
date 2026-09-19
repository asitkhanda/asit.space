import { getPublishedPosts } from "@/lib/posts";
import { getVisitorKey, hasLiked } from "@/lib/likes";
import { TimelineDevice } from "@/components/device/TimelineDevice";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const params = await searchParams;
  const posts = await getPublishedPosts();
  const visitorKey = await getVisitorKey();

  let initialIndex = 0;
  if (params.p) {
    const found = posts.findIndex((post) => post.id === params.p);
    if (found >= 0) initialIndex = found;
  }

  const likedMap: Record<string, boolean> = {};
  if (visitorKey) {
    await Promise.all(
      posts.map(async (post) => {
        likedMap[post.id] = await hasLiked(post.id, visitorKey);
      }),
    );
  }

  return (
    <TimelineDevice
      posts={posts}
      initialIndex={initialIndex}
      likedMap={likedMap}
    />
  );
}
