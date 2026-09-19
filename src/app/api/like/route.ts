import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  VISITOR_COOKIE,
  getVisitorKey,
  likePost,
} from "@/lib/likes";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const postId = body?.postId as string | undefined;

  if (!postId) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  }

  let visitorKey = await getVisitorKey();
  if (!visitorKey) {
    visitorKey = crypto.randomUUID();
    const store = await cookies();
    store.set(VISITOR_COOKIE, visitorKey, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  const result = await likePost(postId, visitorKey);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    already: result.already,
    likeCount: "likeCount" in result ? result.likeCount : undefined,
  });
}
