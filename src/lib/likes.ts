import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const VISITOR_COOKIE = "asit_visitor";

export async function getVisitorKey() {
  const store = await cookies();
  return store.get(VISITOR_COOKIE)?.value ?? null;
}

export async function hasLiked(postId: string, visitorKey: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("visitor_key", visitorKey)
    .maybeSingle();
  return Boolean(data);
}

export async function likePost(postId: string, visitorKey: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("post_likes").insert({
    post_id: postId,
    visitor_key: visitorKey,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: true as const, already: true };
    }
    return { ok: false as const, error: error.message };
  }

  const { data: post } = await supabase
    .from("posts")
    .select("like_count")
    .eq("id", postId)
    .single();

  return {
    ok: true as const,
    already: false,
    likeCount: post?.like_count ?? 0,
  };
}
