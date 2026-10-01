#!/usr/bin/env node
/**
 * Offline-friendly guest invite + QR generator.
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-guest-invites.mjs 10 "Design Meetup"
 *   node --env-file=.env.local scripts/generate-guest-invites.mjs 5
 *
 * Writes:
 *   - tmp/guest-invites/<timestamp>/invites.csv
 *   - tmp/guest-invites/<timestamp>/qr/<token>.png  (if `qrcode` is available)
 *
 * Install optional QR dependency once:
 *   npm i -D qrcode
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const count = Math.max(1, Number(process.argv[2] || 10));
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

const rows = Array.from({ length: count }, () => ({
  token: randomUUID().replace(/-/g, ""),
  label,
}));

const { data, error } = await supabase
  .from("guest_invites")
  .insert(rows)
  .select("token, label, created_at");

if (error) {
  console.error(error.message);
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(process.cwd(), "tmp", "guest-invites", stamp);
const qrDir = path.join(outDir, "qr");
await mkdir(qrDir, { recursive: true });

const invites = data ?? [];
const csv = [
  "token,label,url,created_at",
  ...invites.map((row) => {
    const inviteUrl = `${site}/guest/${row.token}`;
    const safeLabel = (row.label ?? "").replaceAll(",", " ");
    return `${row.token},${safeLabel},${inviteUrl},${row.created_at}`;
  }),
].join("\n");

await writeFile(path.join(outDir, "invites.csv"), csv, "utf8");

let qrcode;
try {
  qrcode = await import("qrcode");
} catch {
  qrcode = null;
}

if (qrcode) {
  for (const row of invites) {
    const inviteUrl = `${site}/guest/${row.token}`;
    const file = path.join(qrDir, `${row.token}.png`);
    await qrcode.toFile(file, inviteUrl, {
      width: 512,
      margin: 2,
      color: { dark: "#111111", light: "#ffffff" },
    });
  }
  console.log(`Wrote ${invites.length} QR PNGs → ${qrDir}`);
} else {
  console.log("qrcode package not installed — CSV URLs only.");
  console.log("Optional: npm i -D qrcode");
}

console.log(`Wrote CSV → ${path.join(outDir, "invites.csv")}`);
for (const row of invites) {
  console.log(`${site}/guest/${row.token}`);
}
