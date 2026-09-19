import { NextResponse } from "next/server";
import { envConfigured, getEnv } from "@/lib/env";
import { handleTelegramUpdate } from "@/lib/telegram/handler";
import type { TelegramUpdate } from "@/lib/telegram/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ secret: string }> };

export async function POST(request: Request, { params }: Params) {
  const { secret } = await params;
  const expected = await getEnv("TELEGRAM_WEBHOOK_SECRET");

  if (!expected) {
    return NextResponse.json(
      { ok: false, reason: "missing_webhook_secret" },
      { status: 401 },
    );
  }

  if (secret !== expected) {
    return NextResponse.json(
      { ok: false, reason: "secret_mismatch" },
      { status: 401 },
    );
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await handleTelegramUpdate(update);
  } catch (err) {
    console.error("telegram webhook error", err);
  }

  // Always 200 so Telegram does not retry forever on app errors
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const configured = await envConfigured([
    "TELEGRAM_WEBHOOK_SECRET",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_ALLOWED_USER_ID",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SITE_URL",
  ]);

  return NextResponse.json({
    ok: true,
    service: "telegram-webhook",
    configured,
  });
}
