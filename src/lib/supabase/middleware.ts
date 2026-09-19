import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const VISITOR_COOKIE = "asit_visitor";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function redirectPreservingCookies(
  request: NextRequest,
  cookiesToSet: CookieToSet[],
  pathname: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  // Preserve auth + visitor cookies (with options) written during this request
  cookiesToSet.forEach(({ name, value, options }) => {
    redirect.cookies.set(name, value, options);
  });
  return redirect;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const cookiesWritten: CookieToSet[] = [];

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
          cookiesWritten.push(...cookiesToSet);
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
    const visitor = {
      name: VISITOR_COOKIE,
      value: crypto.randomUUID(),
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      },
    };
    cookiesWritten.push(visitor);
    supabaseResponse.cookies.set(visitor.name, visitor.value, visitor.options);
  }

  const path = request.nextUrl.pathname;
  const isStudio = path.startsWith("/studio");
  const isLogin = path.startsWith("/studio/login");
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

  if (isStudio && !isLogin) {
    if (!user || user.email?.toLowerCase() !== adminEmail) {
      return redirectPreservingCookies(
        request,
        cookiesWritten,
        "/studio/login",
      );
    }
  }

  if (isLogin && user?.email?.toLowerCase() === adminEmail) {
    return redirectPreservingCookies(request, cookiesWritten, "/studio");
  }

  return supabaseResponse;
}
