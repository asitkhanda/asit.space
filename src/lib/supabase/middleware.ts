import { NextResponse, type NextRequest } from "next/server";

const VISITOR_COOKIE = "asit_visitor";

/** Sets sticky visitor cookie for likes; no auth/studio gates. */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (!request.cookies.get(VISITOR_COOKIE)?.value) {
    response.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return response;
}
