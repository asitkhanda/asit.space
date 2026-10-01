-- Close open anon storage writes for guest photos
drop policy if exists "Anyone can upload guest photos" on storage.objects;

-- Claim only via service role (Next.js /api/guest/submit), not public anon RPC
revoke all on function public.claim_guest_invite(text, text, text, text, double precision, double precision, text) from public, anon, authenticated;
grant execute on function public.claim_guest_invite(text, text, text, text, double precision, double precision, text) to service_role;

-- Keep token lookup for the guest page (read-only)
revoke all on function public.get_guest_invite(text) from public;
grant execute on function public.get_guest_invite(text) to anon, authenticated, service_role;

-- Harden photo path: must be guests/<this-invite-id>/<uuid>.(jpg|jpeg|png|webp)
create or replace function public.claim_guest_invite(
  p_token text,
  p_name text,
  p_note text,
  p_location_name text,
  p_lat double precision,
  p_lng double precision,
  p_photo_path text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite_id uuid;
  v_entry_id uuid;
  v_max_uses integer;
  v_use_count integer;
  v_photo text;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'missing_token';
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'missing_name';
  end if;

  select id, max_uses, use_count
    into v_invite_id, v_max_uses, v_use_count
  from public.guest_invites
  where token = p_token
  for update;

  if v_invite_id is null then
    raise exception 'invite_unavailable';
  end if;

  if v_use_count >= v_max_uses then
    raise exception 'invite_unavailable';
  end if;

  v_photo := nullif(trim(coalesce(p_photo_path, '')), '');
  if v_photo is not null then
    if v_photo !~ ('^guests/' || v_invite_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$') then
      raise exception 'invalid_photo_path';
    end if;
  end if;

  insert into public.guest_entries (
    invite_id, name, note, location_name, lat, lng, photo_path
  ) values (
    v_invite_id,
    trim(p_name),
    nullif(trim(coalesce(p_note, '')), ''),
    nullif(trim(coalesce(p_location_name, '')), ''),
    p_lat,
    p_lng,
    v_photo
  )
  returning id into v_entry_id;

  update public.guest_invites
  set
    use_count = use_count + 1,
    entry_id = v_entry_id,
    used_at = case
      when use_count + 1 >= max_uses then now()
      else used_at
    end
  where id = v_invite_id;

  return v_entry_id;
end;
$$;

revoke all on function public.claim_guest_invite(text, text, text, text, double precision, double precision, text) from public, anon, authenticated;
grant execute on function public.claim_guest_invite(text, text, text, text, double precision, double precision, text) to service_role;
