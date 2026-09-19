import { createClient } from "@/lib/supabase/server";
import type { Person, Post, PostWithPeople } from "@/lib/types";

export async function getPublishedPosts(): Promise<PostWithPeople[]> {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("occurred_at", { ascending: false });

  if (error || !posts?.length) return [];

  const ids = posts.map((p) => p.id);
  const { data: people } = await supabase
    .from("people")
    .select("*")
    .in("post_id", ids)
    .order("sort_order", { ascending: true });

  const byPost = new Map<string, Person[]>();
  (people ?? []).forEach((person) => {
    const list = byPost.get(person.post_id) ?? [];
    list.push(person as Person);
    byPost.set(person.post_id, list);
  });

  return (posts as Post[]).map((post) => ({
    ...post,
    people: byPost.get(post.id) ?? [],
  }));
}

export async function getPostById(id: string): Promise<PostWithPeople | null> {
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!post) return null;

  const { data: people } = await supabase
    .from("people")
    .select("*")
    .eq("post_id", id)
    .order("sort_order", { ascending: true });

  return { ...(post as Post), people: (people as Person[]) ?? [] };
}

export type ArchiveGroup = {
  key: string;
  year: number;
  month: number;
  posts: PostWithPeople[];
};

export function groupPostsByMonth(posts: PostWithPeople[]): ArchiveGroup[] {
  const map = new Map<string, ArchiveGroup>();
  posts.forEach((post) => {
    const d = new Date(post.occurred_at);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${month.toString().padStart(2, "0")}`;
    const existing = map.get(key);
    if (existing) {
      existing.posts.push(post);
    } else {
      map.set(key, { key, year, month, posts: [post] });
    }
  });
  return Array.from(map.values()).sort((a, b) =>
    a.key < b.key ? 1 : a.key > b.key ? -1 : 0,
  );
}
