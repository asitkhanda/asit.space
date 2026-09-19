import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Only same-origin relative paths under /studio — blocks open redirects. */
function safeStudioPath(raw: string | null): string {
  const fallback = "/studio";
  if (!raw) return fallback;

  // Must be a root-relative path (not //evil, not @evil, not https://…)
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (raw.includes("://") || raw.includes("\\") || raw.includes("@")) {
    return fallback;
  }

  // Keep post-login landing inside the studio surface
  if (raw !== "/studio" && !raw.startsWith("/studio/")) return fallback;

  return raw;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeStudioPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const admin = process.env.ADMIN_EMAIL?.toLowerCase();
      if (user?.email?.toLowerCase() !== admin) {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          `${origin}/studio/login?error=unauthorized`,
        );
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/studio/login?error=auth`);
}
