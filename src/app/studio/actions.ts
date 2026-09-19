"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { mapsUrlFromCoords } from "@/lib/format";

export type PersonInput = {
  name: string;
  twitter_handle?: string;
  linkedin_url?: string;
};

export async function createPostAction(formData: FormData) {
  const { supabase } = await requireAdmin();

  const photo = formData.get("photo") as File | null;
  const locationName = String(formData.get("location_name") ?? "").trim();
  const occurredAt = String(formData.get("occurred_at") ?? "");
  const latRaw = String(formData.get("lat") ?? "");
  const lngRaw = String(formData.get("lng") ?? "");
  const mapsUrlField = String(formData.get("maps_url") ?? "").trim();
  const published = formData.get("published") === "on";
  const peopleJson = String(formData.get("people_json") ?? "[]");

  if (!photo || photo.size === 0) {
    throw new Error("Photo is required");
  }
  if (photo.size > 2_000_000) {
    throw new Error("Photo too large after compression (max 2MB)");
  }

  const lat = latRaw ? Number(latRaw) : null;
  const lng = lngRaw ? Number(lngRaw) : null;
  const maps_url =
    mapsUrlField ||
    (lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)
      ? mapsUrlFromCoords(lat, lng)
      : null);

  const occurredIso = occurredAt
    ? new Date(occurredAt).toISOString()
    : new Date().toISOString();

  const ext = photo.type === "image/png" ? "png" : "webp";
  const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(path, photo, {
      contentType: photo.type || "image/webp",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      occurred_at: occurredIso,
      location_name: locationName,
      lat: lat != null && !Number.isNaN(lat) ? lat : null,
      lng: lng != null && !Number.isNaN(lng) ? lng : null,
      maps_url,
      photo_path: path,
      published,
    })
    .select("id")
    .single();

  if (postError || !post) {
    await supabase.storage.from("photos").remove([path]);
    throw new Error(postError?.message ?? "Failed to create post");
  }

  let people: PersonInput[] = [];
  try {
    people = JSON.parse(peopleJson) as PersonInput[];
  } catch {
    people = [];
  }

  const rows = people
    .filter((p) => p.name.trim())
    .map((p, i) => ({
      post_id: post.id,
      name: p.name.trim(),
      twitter_handle: p.twitter_handle?.replace(/^@/, "").trim() || null,
      linkedin_url: p.linkedin_url?.trim() || null,
      sort_order: i,
    }));

  if (rows.length) {
    const { error: peopleError } = await supabase.from("people").insert(rows);
    if (peopleError) {
      throw new Error(peopleError.message);
    }
  }

  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath("/studio");
  redirect("/studio");
}

export async function togglePublishAction(postId: string, published: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("posts")
    .update({ published })
    .eq("id", postId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath("/studio");
}

export async function deletePostAction(postId: string) {
  const { supabase } = await requireAdmin();
  const { data: post } = await supabase
    .from("posts")
    .select("photo_path")
    .eq("id", postId)
    .single();

  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw new Error(error.message);

  if (post?.photo_path) {
    await supabase.storage.from("photos").remove([post.photo_path]);
  }

  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath("/studio");
}

export async function signOutAction() {
  const { supabase } = await requireAdmin();
  await supabase.auth.signOut();
  redirect("/studio/login");
}
