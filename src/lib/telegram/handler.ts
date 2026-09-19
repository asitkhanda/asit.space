import { getEnv } from "@/lib/env";
import { readExifMeta } from "@/lib/exif";
import { mapsUrlFromCoords } from "@/lib/format";
import { createServiceClient } from "@/lib/supabase/service";
import { downloadFile, getFile, sendMessage } from "@/lib/telegram/api";
import {
  locationFromTelegram,
  parseMapsLink,
} from "@/lib/telegram/maps";
import { parsePeopleLines } from "@/lib/telegram/people";
import type {
  BotDraft,
  TelegramMessage,
  TelegramUpdate,
} from "@/lib/telegram/types";

const HELP = `asit.space publisher

Send a photo (File preferred — keeps GPS EXIF).

If location is missing, share a Telegram location pin or a Google Maps link.

Then list people (one per line):
Name | @twitter | https://linkedin.com/in/...

Commands:
/start /help — this message
/skip — skip people (when asked)
/cancel — abandon draft
/delete last — remove newest post`;

const PEOPLE_PROMPT = `Anyone in this photo?

One person per line:
Name | @twitter | https://linkedin.com/in/...

Twitter and LinkedIn are optional.
Send /skip for none.`;

const LOCATION_PROMPT = `No GPS in that photo.

Share a Telegram location pin, or paste a Google Maps link.
(/cancel to abort)`;

function allowedUserId(): string | null {
  const raw = getEnv("TELEGRAM_ALLOWED_USER_ID");
  if (!raw) return null;
  // Keep as string — Telegram IDs can exceed safe integer range in edge cases
  if (!/^-?\d+$/.test(raw)) return null;
  return raw;
}

function siteUrl() {
  return (getEnv("NEXT_PUBLIC_SITE_URL") ?? "https://asit.space").replace(
    /\/$/,
    "",
  );
}

function missingConfigMessage() {
  const missing = [
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_ALLOWED_USER_ID",
    "TELEGRAM_WEBHOOK_SECRET",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
  ].filter((key) => !getEnv(key));
  if (!missing.length) return null;
  return `Server config incomplete. Missing: ${missing.join(", ")}. Add them under Cloudflare Worker → Settings → Variables and Secrets (runtime), then redeploy with --keep-vars.`;
}

function extForMime(mime: string | null | undefined) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/heic" || mime === "image/heif") return "heic";
  return "jpg";
}

async function getDraft(chatId: number): Promise<BotDraft | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("bot_drafts")
    .select("*")
    .eq("chat_id", chatId)
    .maybeSingle();
  return data as BotDraft | null;
}

async function clearDraft(chatId: number) {
  const supabase = createServiceClient();
  await supabase.from("bot_drafts").delete().eq("chat_id", chatId);
}

async function upsertDraft(
  draft: Omit<BotDraft, "file_unique_id" | "mime_type"> & {
    file_unique_id?: string | null;
    mime_type?: string | null;
  },
) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("bot_drafts").upsert(
    {
      chat_id: draft.chat_id,
      step: draft.step,
      file_id: draft.file_id,
      file_unique_id: draft.file_unique_id ?? null,
      mime_type: draft.mime_type ?? null,
      occurred_at: draft.occurred_at,
      lat: draft.lat,
      lng: draft.lng,
      maps_url: draft.maps_url,
      location_name: draft.location_name,
    },
    { onConflict: "chat_id" },
  );
  if (error) throw new Error(error.message);
}

async function publishDraft(
  chatId: number,
  draft: BotDraft,
  peopleText: string | null,
) {
  const supabase = createServiceClient();
  const file = await getFile(draft.file_id);
  const buffer = await downloadFile(file.file_path!);

  if (buffer.byteLength > 8_000_000) {
    await sendMessage(chatId, "Photo too large (max 8MB).");
    return;
  }

  const mime = draft.mime_type || "image/jpeg";
  const path = `${Date.now()}-${crypto.randomUUID()}.${extForMime(mime)}`;

  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(path, buffer, {
      contentType: mime,
      upsert: false,
    });

  if (uploadError) {
    await sendMessage(chatId, `Upload failed: ${uploadError.message}`);
    return;
  }

  const locationName =
    draft.location_name?.trim() ||
    (draft.lat != null && draft.lng != null
      ? `Pin ${draft.lat.toFixed(4)}, ${draft.lng.toFixed(4)}`
      : "Somewhere");

  const mapsUrl =
    draft.maps_url ||
    (draft.lat != null && draft.lng != null
      ? mapsUrlFromCoords(draft.lat, draft.lng)
      : null);

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      occurred_at: draft.occurred_at,
      location_name: locationName,
      lat: draft.lat,
      lng: draft.lng,
      maps_url: mapsUrl,
      photo_path: path,
      published: true,
    })
    .select("id")
    .single();

  if (postError || !post) {
    await supabase.storage.from("photos").remove([path]);
    await sendMessage(
      chatId,
      `Failed to create post: ${postError?.message ?? "unknown"}`,
    );
    return;
  }

  const people =
    peopleText && peopleText.trim().toLowerCase() !== "/skip"
      ? parsePeopleLines(peopleText)
      : [];

  if (people.length) {
    const rows = people.map((p, i) => ({
      post_id: post.id,
      name: p.name,
      twitter_handle: p.twitter_handle,
      linkedin_url: p.linkedin_url,
      sort_order: i,
    }));
    const { error: peopleError } = await supabase.from("people").insert(rows);
    if (peopleError) {
      await sendMessage(
        chatId,
        `Post saved, but people failed: ${peopleError.message}`,
      );
      await clearDraft(chatId);
      return;
    }
  }

  await clearDraft(chatId);
  await sendMessage(
    chatId,
    `Published.\n${siteUrl()}/?p=${post.id}`,
  );
}

async function deleteLastPost(chatId: number) {
  const supabase = createServiceClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id, photo_path")
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!post) {
    await sendMessage(chatId, "No posts to delete.");
    return;
  }

  const { error } = await supabase.from("posts").delete().eq("id", post.id);
  if (error) {
    await sendMessage(chatId, `Delete failed: ${error.message}`);
    return;
  }

  if (post.photo_path && !post.photo_path.startsWith("/")) {
    await supabase.storage.from("photos").remove([post.photo_path]);
  }

  await sendMessage(chatId, "Deleted the newest post.");
}

async function startFromImage(message: TelegramMessage) {
  const chatId = message.chat.id;
  let fileId: string | null = null;
  let fileUniqueId: string | null = null;
  let mime: string | null = "image/jpeg";

  if (message.photo?.length) {
    const best = message.photo[message.photo.length - 1];
    fileId = best.file_id;
    fileUniqueId = best.file_unique_id;
    mime = "image/jpeg";
  } else if (message.document) {
    const doc = message.document;
    const mt = doc.mime_type ?? "";
    if (!mt.startsWith("image/")) {
      await sendMessage(chatId, "Send an image photo or image file.");
      return;
    }
    fileId = doc.file_id;
    fileUniqueId = doc.file_unique_id;
    mime = mt;
  }

  if (!fileId) return;

  let occurredAt = new Date(message.date * 1000);
  let lat: number | null = null;
  let lng: number | null = null;

  try {
    const file = await getFile(fileId);
    const buffer = await downloadFile(file.file_path!);
    const exif = await readExifMeta(buffer);
    if (exif.occurredAt) occurredAt = exif.occurredAt;
    lat = exif.lat;
    lng = exif.lng;
  } catch (err) {
    console.error("exif/download", err);
  }

  const hasGps = lat != null && lng != null;

  await upsertDraft({
    chat_id: chatId,
    step: hasGps ? "awaiting_people" : "awaiting_location",
    file_id: fileId,
    file_unique_id: fileUniqueId,
    mime_type: mime,
    occurred_at: occurredAt.toISOString(),
    lat,
    lng,
    maps_url: hasGps ? mapsUrlFromCoords(lat!, lng!) : null,
    location_name: hasGps
      ? `Pin ${lat!.toFixed(4)}, ${lng!.toFixed(4)}`
      : null,
  });

  if (hasGps) {
    await sendMessage(
      chatId,
      `Got it — ${occurredAt.toISOString().slice(0, 10)} @ ${lat!.toFixed(4)}, ${lng!.toFixed(4)}\n\n${PEOPLE_PROMPT}`,
    );
  } else {
    await sendMessage(chatId, LOCATION_PROMPT);
  }
}

async function handleLocationStep(message: TelegramMessage, draft: BotDraft) {
  const chatId = message.chat.id;

  if (message.venue) {
    const loc = locationFromTelegram(
      message.venue.location.latitude,
      message.venue.location.longitude,
      message.venue.title,
    );
    await upsertDraft({
      ...draft,
      step: "awaiting_people",
      lat: loc.lat,
      lng: loc.lng,
      maps_url: loc.maps_url,
      location_name: loc.location_name,
    });
    await sendMessage(chatId, PEOPLE_PROMPT);
    return;
  }

  if (message.location) {
    const loc = locationFromTelegram(
      message.location.latitude,
      message.location.longitude,
    );
    await upsertDraft({
      ...draft,
      step: "awaiting_people",
      lat: loc.lat,
      lng: loc.lng,
      maps_url: loc.maps_url,
      location_name: loc.location_name,
    });
    await sendMessage(chatId, PEOPLE_PROMPT);
    return;
  }

  const text = message.text?.trim();
  if (!text) {
    await sendMessage(chatId, LOCATION_PROMPT);
    return;
  }

  const parsed = await parseMapsLink(text);
  if (!parsed) {
    await sendMessage(
      chatId,
      "Couldn’t read that. Send a location pin or a Google Maps link.",
    );
    return;
  }

  await upsertDraft({
    ...draft,
    step: "awaiting_people",
    lat: parsed.lat,
    lng: parsed.lng,
    maps_url: parsed.maps_url,
    location_name: parsed.location_name,
  });
  await sendMessage(chatId, PEOPLE_PROMPT);
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;
  if (!message?.from) return;

  const chatId = message.chat.id;

  // Prefer telling the user when runtime secrets are missing (common after deploy wipe)
  const configError = missingConfigMessage();
  if (configError) {
    console.error(configError);
    if (getEnv("TELEGRAM_BOT_TOKEN")) {
      try {
        await sendMessage(chatId, configError);
      } catch (err) {
        console.error("sendMessage failed", err);
      }
    }
    return;
  }

  const allowed = allowedUserId();
  if (allowed == null) {
    console.error("TELEGRAM_ALLOWED_USER_ID invalid");
    await sendMessage(chatId, "TELEGRAM_ALLOWED_USER_ID is invalid.");
    return;
  }

  if (String(message.from.id) !== allowed) {
    await sendMessage(chatId, "Unauthorized.");
    return;
  }

  const text = message.text?.trim() ?? "";
  const cmd = text.split(/\s+/)[0]?.toLowerCase() ?? "";

  try {
    if (cmd === "/start" || cmd === "/help") {
      await sendMessage(chatId, HELP);
      return;
    }

    if (cmd === "/cancel") {
      await clearDraft(chatId);
      await sendMessage(chatId, "Draft cancelled.");
      return;
    }

    if (cmd === "/delete" && text.toLowerCase().startsWith("/delete last")) {
      await deleteLastPost(chatId);
      return;
    }

    const draft = await getDraft(chatId);

    if (message.photo?.length || message.document) {
      await startFromImage(message);
      return;
    }

    if (!draft) {
      if (text) {
        await sendMessage(chatId, "Send a photo to start a post.\n\n" + HELP);
      }
      return;
    }

    if (draft.step === "awaiting_location") {
      await handleLocationStep(message, draft);
      return;
    }

    if (draft.step === "awaiting_people") {
      if (!text && !message.caption) {
        await sendMessage(chatId, PEOPLE_PROMPT);
        return;
      }
      await publishDraft(chatId, draft, text || message.caption || "/skip");
    }
  } catch (err) {
    console.error("telegram handler error", err);
    const detail = err instanceof Error ? err.message : "unknown error";
    try {
      await sendMessage(chatId, `Something went wrong: ${detail}`);
    } catch {
      /* ignore */
    }
  }
}
