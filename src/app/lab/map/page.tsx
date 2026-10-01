import { getPublishedPosts } from "@/lib/posts";
import { MapTimeline } from "@/components/map/MapTimeline";

export const metadata = {
  title: "Lab · Map timeline — asit.space",
  robots: { index: false, follow: false },
};

export default async function MapLabPage() {
  const posts = await getPublishedPosts();
  return <MapTimeline posts={posts} />;
}
