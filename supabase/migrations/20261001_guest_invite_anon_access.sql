-- Public read of a single invite by token (no table-wide SELECT)
drop function if exists public.get_guest_invite(text);

create or replace function public.get_guest_invite(p_token text)
returns table (
  id uuid,
  token text,
  label text,
  created_at timestamptz,
  used_at timestamptz,
  entry_id uuid,
  max_uses integer,
  use_count integer
)
language sql
security definer
set search_path = public
as $$
  select gi.id, gi.token, gi.label, gi.created_at, gi.used_at, gi.entry_id, gi.max_uses, gi.use_count
  from public.guest_invites gi
  where gi.token = p_token
  limit 1;
$$;

revoke all on function public.get_guest_invite(text) from public;
grant execute on function public.get_guest_invite(text) to anon, authenticated, service_role;

-- Allow guest form submit without service role (RPC is security definer)
revoke all on function public.claim_guest_invite(text, text, text, text, double precision, double precision, text) from public;
grant execute on function public.claim_guest_invite(text, text, text, text, double precision, double precision, text) to anon, authenticated, service_role;

-- Guest postcard photo uploads (path guests/...)
drop policy if exists "Anyone can upload guest photos" on storage.objects;
create policy "Anyone can upload guest photos"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = 'guests'
  );
