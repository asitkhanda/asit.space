#!/usr/bin/env node
/**
 * Shared multi-use guest invite + QR generator.
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-guest-invites.mjs 30 "Design Meetup"
 *   node --env-file=.env.local scripts/generate-guest-invites.mjs 20
 *
 * Args:
 *   1) maxUses  — how many submissions this one QR accepts (default 30)
 *   2) label    — optional event label
 *
 * Writes one invite + one QR (same URL for every printed postcard):
 *   - tmp/guest-invites/<timestamp>/invite.txt
 *   - tmp/guest-invites/<timestamp>/qr.png  (if `qrcode` is available)
 *
 * Optional: npm i -D qrcode
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const maxUses = Math.max(1, Number(process.argv[2] || 30));
const label = process.argv[3] || null;
const site =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const token = randomUUID().replace(/-/g, "");

const { data, error } = await supabase
  .from("guest_invites")
  .insert({
    token,
    label,
    max_uses: maxUses,
    use_count: 0,
  })
  .select("token, label, max_uses, created_at")
  .single();

if (error || !data) {
  console.error(error?.message ?? "Insert failed");
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(process.cwd(), "tmp", "guest-invites", stamp);
await mkdir(outDir, { recursive: true });

const inviteUrl = `${site}/guest/${data.token}`;
const summary = [
  `label: ${data.label ?? "(none)"}`,
  `max_uses: ${data.max_uses}`,
  `token: ${data.token}`,
  `url: ${inviteUrl}`,
  `created_at: ${data.created_at}`,
  "",
  "Print this single QR on every postcard in the batch.",
].join("\n");

await writeFile(path.join(outDir, "invite.txt"), summary, "utf8");

let qrcode;
try {
  qrcode = await import("qrcode");
} catch {
  qrcode = null;
}

if (qrcode) {
  const file = path.join(outDir, "qr.png");
  await qrcode.toFile(file, inviteUrl, {
    width: 512,
    margin: 2,
    color: { dark: "#111111", light: "#ffffff" },
  });
  console.log(`Wrote QR → ${file}`);
} else {
  console.log("qrcode package not installed — URL only.");
  console.log("Optional: npm i -D qrcode");
}

console.log(`Wrote details → ${path.join(outDir, "invite.txt")}`);
console.log(inviteUrl);
console.log(`Accepts up to ${data.max_uses} submissions.`);
