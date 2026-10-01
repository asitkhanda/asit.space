-- Single-use postcard invites + guest entries (mirror of applied migration)
create table if not exists public.guest_invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  label text,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  entry_id uuid
);

create table if not exists public.guest_entries (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null unique references public.guest_invites (id) on delete restrict,
  name text not null,
  note text,
  location_name text,
  lat double precision,
  lng double precision,
  photo_path text,
  created_at timestamptz not null default now()
);

alter table public.guest_invites
  add constraint guest_invites_entry_id_fkey
  foreign key (entry_id) references public.guest_entries (id) on delete set null;

create index if not exists guest_entries_created_at_idx
  on public.guest_entries (created_at desc);

alter table public.guest_invites enable row level security;
alter table public.guest_entries enable row level security;

create policy "Public read guest entries"
  on public.guest_entries
  for select
  to anon, authenticated
  using (true);

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
begin
  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'missing_token';
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'missing_name';
  end if;

  select id into v_invite_id
  from public.guest_invites
  where token = p_token and used_at is null
  for update;

  if v_invite_id is null then
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
  set used_at = now(), entry_id = v_entry_id
  where id = v_invite_id;

  return v_entry_id;
end;
$$;

revoke all on function public.claim_guest_invite(text, text, text, text, double precision, double precision, text) from public;
grant execute on function public.claim_guest_invite(text, text, text, text, double precision, double precision, text) to service_role;
