import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { handleTelegramUpdate } from "@/lib/telegram/handler";
import type { TelegramUpdate } from "@/lib/telegram/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ secret: string }> };

export async function POST(request: Request, { params }: Params) {
  const { secret } = await params;
  const expected = getEnv("TELEGRAM_WEBHOOK_SECRET");

  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
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
  return NextResponse.json({ ok: true, service: "telegram-webhook" });
}
