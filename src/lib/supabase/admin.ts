import { createClient } from "@/lib/supabase/server";

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL?.toLowerCase() ?? "";
}

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || user.email.toLowerCase() !== getAdminEmail()) {
    throw new Error("Unauthorized");
  }

  return { supabase, user };
}

export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || user.email.toLowerCase() !== getAdminEmail()) {
    return null;
  }

  return user;
}
