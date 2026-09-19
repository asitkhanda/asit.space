import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const VISITOR_COOKIE = "asit_visitor";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!request.cookies.get(VISITOR_COOKIE)?.value) {
    supabaseResponse.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  const path = request.nextUrl.pathname;
  const isStudio = path.startsWith("/studio");
  const isLogin = path.startsWith("/studio/login");
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

  if (isStudio && !isLogin) {
    if (!user || user.email?.toLowerCase() !== adminEmail) {
      const url = request.nextUrl.clone();
      url.pathname = "/studio/login";
      return NextResponse.redirect(url);
    }
  }

  if (isLogin && user?.email?.toLowerCase() === adminEmail) {
    const url = request.nextUrl.clone();
    url.pathname = "/studio";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
