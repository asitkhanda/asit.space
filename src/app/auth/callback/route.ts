import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/studio";

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
