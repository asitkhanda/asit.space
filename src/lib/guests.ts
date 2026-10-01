import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { GuestEntry, GuestInvite } from "@/lib/types";

export async function getInviteByToken(token: string): Promise<GuestInvite | null> {
  // Anon + security-definer RPC — works without SUPABASE_SERVICE_ROLE_KEY
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("get_guest_invite", { p_token: token })
    .maybeSingle();
  if (error || !data) return null;
  return data as GuestInvite;
}

export async function listGuestEntries(): Promise<GuestEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guest_entries")
    .select(
      "id, invite_id, name, note, location_name, lat, lng, photo_path, created_at",
    )
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as GuestEntry[];
}

export async function createGuestInvites(
  count: number,
  label?: string,
  maxUses = 1,
) {
  const supabase = await createServiceClient();
  const rows = Array.from({ length: count }, () => ({
    token: crypto.randomUUID().replace(/-/g, ""),
    label: label ?? null,
    max_uses: Math.max(1, maxUses),
    use_count: 0,
  }));
  const { data, error } = await supabase
    .from("guest_invites")
    .insert(rows)
    .select("id, token, label, created_at, used_at, entry_id, max_uses, use_count");
  if (error) throw new Error(error.message);
  return (data ?? []) as GuestInvite[];
}
