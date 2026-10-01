import { getPublishedPosts } from "@/lib/posts";
import { MapTimeline } from "@/components/map/MapTimeline";

export const metadata = {
  title: "asit.space",
  description: "A personal timeline of events, outings, and moments.",
};

export default async function HomePage() {
  const posts = await getPublishedPosts();
  return <MapTimeline posts={posts} />;
}
