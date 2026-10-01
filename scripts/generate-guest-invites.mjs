#!/usr/bin/env node
/**
 * Guest invite + QR generator.
 *
 * Shared multi-use (one QR for a whole batch):
 *   node --env-file=.env.local scripts/generate-guest-invites.mjs 30 "Design Meetup"
 *
 * Distinct postcards (one QR each):
 *   node --env-file=.env.local scripts/generate-guest-invites.mjs --count 3
 *   node --env-file=.env.local scripts/generate-guest-invites.mjs --count 3 --uses 1 "Postcard"
 *
 * Writes under tmp/guest-invites/<timestamp>/:
 *   - invites.txt
 *   - qr-01.png … (if `qrcode` is available)
 *
 * Optional: npm i -D qrcode
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

function parseArgs(argv) {
  let count = null;
  let maxUses = null;
  let label = null;
  const positionals = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--count") {
      count = Math.max(1, Number(argv[++i] || 1));
    } else if (arg === "--uses") {
      maxUses = Math.max(1, Number(argv[++i] || 1));
    } else if (arg === "--label") {
      label = argv[++i] || null;
    } else if (arg.startsWith("--")) {
      console.error(`Unknown flag: ${arg}`);
      process.exit(1);
    } else {
      positionals.push(arg);
    }
  }

  // Legacy: `30 "Event"` → one shared invite with max_uses=30
  if (count == null) {
    count = 1;
    if (positionals[0] != null && maxUses == null) {
      maxUses = Math.max(1, Number(positionals[0] || 30));
    }
    if (positionals[1] != null && label == null) {
      label = positionals[1];
    }
  } else if (positionals[0] != null && label == null) {
    label = positionals[0];
  }

  if (maxUses == null) {
    maxUses = count > 1 ? 1 : 30;
  }

  return { count, maxUses, label };
}

const { count, maxUses, label } = parseArgs(process.argv.slice(2));
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

const rows = Array.from({ length: count }, (_, index) => ({
  token: randomUUID().replace(/-/g, ""),
  label: count === 1 ? label : label ? `${label} ${index + 1}` : null,
  max_uses: maxUses,
  use_count: 0,
}));

const { data, error } = await supabase
  .from("guest_invites")
  .insert(rows)
  .select("token, label, max_uses, created_at");

if (error || !data?.length) {
  console.error(error?.message ?? "Insert failed");
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(process.cwd(), "tmp", "guest-invites", stamp);
await mkdir(outDir, { recursive: true });

const lines = [
  `site: ${site}`,
  `count: ${data.length}`,
  `max_uses each: ${maxUses}`,
  "",
];

for (const [index, row] of data.entries()) {
  const inviteUrl = `${site}/guest/${row.token}`;
  const n = String(index + 1).padStart(2, "0");
  lines.push(`#${n}`);
  lines.push(`label: ${row.label ?? "(none)"}`);
  lines.push(`token: ${row.token}`);
  lines.push(`url: ${inviteUrl}`);
  lines.push(`max_uses: ${row.max_uses}`);
  lines.push("");
}

await writeFile(path.join(outDir, "invites.txt"), lines.join("\n"), "utf8");

let qrcode;
try {
  qrcode = await import("qrcode");
} catch {
  qrcode = null;
}

if (qrcode) {
  for (const [index, row] of data.entries()) {
    const inviteUrl = `${site}/guest/${row.token}`;
    const n = String(index + 1).padStart(2, "0");
    const file = path.join(outDir, `qr-${n}.png`);
    await qrcode.toFile(file, inviteUrl, {
      width: 512,
      margin: 2,
      color: { dark: "#111111", light: "#ffffff" },
    });
    console.log(`Wrote QR → ${file}`);
  }
} else {
  console.log("qrcode package not installed — URLs only.");
  console.log("Optional: npm i -D qrcode");
}

console.log(`Wrote details → ${path.join(outDir, "invites.txt")}`);
for (const row of data) {
  console.log(`${site}/guest/${row.token}`);
}
console.log(
  count === 1
    ? `Accepts up to ${maxUses} submissions.`
    : `${count} distinct postcards · ${maxUses} use(s) each.`,
);
