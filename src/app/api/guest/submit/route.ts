import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const MAX_NOTE = 280;
const MAX_NAME = 80;
const MAX_LOCATION = 120;
const MAX_BYTES = 8 * 1024 * 1024;

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad("Invalid form data");
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

  const supabase = await createServiceClient();

  const { data: invite, error: inviteError } = await supabase
    .from("guest_invites")
    .select("id, used_at")
    .eq("token", token)
    .maybeSingle();

  if (inviteError || !invite) return bad("This invite link is invalid.", 404);
  if (invite.used_at) {
    return bad("This postcard invite was already used.", 409);
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
    const buffer = Buffer.from(await photo.arrayBuffer());
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
      ? "This postcard invite was already used."
      : claimError.message.includes("missing_name")
        ? "Please add your name."
        : "Could not save your postcard.";
    const status = claimError.message.includes("invite_unavailable") ? 409 : 400;
    return bad(message, status);
  }

  return NextResponse.json({ ok: true, id: entryId });
}
