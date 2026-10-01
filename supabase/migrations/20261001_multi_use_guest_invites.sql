-- Multi-use guest invites: one QR, many submissions (capped)
alter table public.guest_invites
  add column if not exists max_uses integer not null default 1,
  add column if not exists use_count integer not null default 0;

alter table public.guest_invites
  drop constraint if exists guest_invites_max_uses_check;

alter table public.guest_invites
  add constraint guest_invites_max_uses_check check (max_uses >= 1);

alter table public.guest_invites
  drop constraint if exists guest_invites_use_count_check;

alter table public.guest_invites
  add constraint guest_invites_use_count_check check (use_count >= 0);

-- Many entries may share one invite
alter table public.guest_entries
  drop constraint if exists guest_entries_invite_id_key;

create index if not exists guest_entries_invite_id_idx
  on public.guest_entries (invite_id);

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

  insert into public.guest_entries (
    invite_id, name, note, location_name, lat, lng, photo_path
  ) values (
    v_invite_id,
    trim(p_name),
    nullif(trim(coalesce(p_note, '')), ''),
    nullif(trim(coalesce(p_location_name, '')), ''),
    p_lat,
    p_lng,
    nullif(trim(coalesce(p_photo_path, '')), '')
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
