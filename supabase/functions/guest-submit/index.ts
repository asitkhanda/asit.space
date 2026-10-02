import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const MAX_NOTE = 280;
const MAX_NAME = 80;
const MAX_LOCATION = 120;
const MAX_BYTES = 8 * 1024 * 1024;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function bad(message: string, status = 400) {
  return json({ error: message }, status);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, apikey, content-type, x-client-info",
      },
    });
  }

  if (req.method !== "POST") return bad("Method not allowed", 405);

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return bad("Server misconfigured", 500);

  let form: FormData;
  try {
    form = await req.formData();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown";
    return bad(`Invalid form data (${detail})`);
  }

  const token = String(form.get("token") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const note = String(form.get("note") ?? "").trim();
  const locationName = String(form.get("location_name") ?? "").trim();
  const latRaw = String(form.get("lat") ?? "").trim();
  const lngRaw = String(form.get("lng") ?? "").trim();
  const photo = form.get("photo");

  if (!token) return bad("This invite link is invalid.");
  if (!name) return bad("Please add your name.");
  if (name.length > MAX_NAME) return bad("Name is too long.");
  if (note.length > MAX_NOTE) return bad("Note is too long (280 max).");
  if (locationName.length > MAX_LOCATION) return bad("Location is too long.");

  const lat = latRaw ? Number(latRaw) : null;
  const lng = lngRaw ? Number(lngRaw) : null;
  if (
    (lat != null && !Number.isFinite(lat)) ||
    (lng != null && !Number.isFinite(lng))
  ) {
    return bad("Location coordinates look invalid.");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: invite, error: inviteError } = await supabase
    .from("guest_invites")
    .select("id, used_at, max_uses, use_count")
    .eq("token", token)
    .maybeSingle();

  if (inviteError || !invite) return bad("This invite link is invalid.", 404);

  const maxUses = invite.max_uses ?? 1;
  const useCount = invite.use_count ?? 0;
  // used_at is set when the batch hits max_uses; trust the counters so raising
  // max_uses on a previously-exhausted invite reopens without a manual used_at clear.
  if (useCount >= maxUses) {
    return bad("This postcard invite is full — no submissions left.", 409);
  }

  let photoPath: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_BYTES) return bad("Photo must be under 8MB.");
    if (!photo.type.startsWith("image/")) return bad("Photo must be an image.");

    const ext =
      photo.type === "image/png"
        ? "png"
        : photo.type === "image/webp"
          ? "webp"
          : "jpg";
    photoPath = `guests/${invite.id}/${crypto.randomUUID()}.${ext}`;
    const buffer = new Uint8Array(await photo.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(photoPath, buffer, {
        contentType: photo.type || "image/jpeg",
        upsert: false,
      });
    if (uploadError) {
      return bad(`Photo upload failed: ${uploadError.message}`, 500);
    }
  }

  const { data: entryId, error: claimError } = await supabase.rpc(
    "claim_guest_invite",
    {
      p_token: token,
      p_name: name,
      p_note: note || null,
      p_location_name: locationName || null,
      p_lat: lat,
      p_lng: lng,
      p_photo_path: photoPath,
    },
  );

  if (claimError) {
    if (photoPath) {
      await supabase.storage.from("photos").remove([photoPath]);
    }
    const message = claimError.message.includes("invite_unavailable")
      ? "This postcard invite is full — no submissions left."
      : claimError.message.includes("missing_name")
        ? "Please add your name."
        : claimError.message.includes("invalid_photo_path")
          ? "Photo path was rejected."
          : "Could not save your postcard.";
    const status = claimError.message.includes("invite_unavailable") ? 409 : 400;
    return bad(message, status);
  }

  return json({ ok: true, id: entryId });
});
