import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Same-origin guest submit proxy. Forwards the raw multipart body to the
 * Supabase Edge Function `guest-submit` (which holds the service role key).
 */
export async function POST(request: Request) {
  const url = await getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anon = await getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anon) {
    return NextResponse.json(
      { error: "Server is missing Supabase public config." },
      { status: 500 },
    );
  }

  const contentType = request.headers.get("content-type") || "";
  let rawBody: ArrayBuffer;
  try {
    rawBody = await request.arrayBuffer();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const edgeUrl = `${url.replace(/\/$/, "")}/functions/v1/guest-submit`;
  let upstream: Response;
  try {
    upstream = await fetch(edgeUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${anon}`,
        apikey: anon,
        ...(contentType ? { "Content-Type": contentType } : {}),
      },
      body: rawBody,
      signal: AbortSignal.timeout(40000),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach guest submit service." },
      { status: 502 },
    );
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "application/json",
    },
  });
}
