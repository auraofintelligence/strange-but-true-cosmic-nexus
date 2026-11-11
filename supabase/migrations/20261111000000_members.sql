begin;

create schema if not exists nexus_private;
revoke all on schema nexus_private from public, anon, authenticated;

create table public.nexus_library (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('article', 'film', 'research')),
  title text not null check (char_length(trim(title)) between 1 and 140),
  summary text not null default '',
  body text not null default '',
  media_path text,
  published_at timestamptz,
  check (trim(body) <> '' or media_path is not null)
);

create table public.nexus_circles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  description text not null default '' check (char_length(description) <= 1000),
  created_at timestamptz not null default now()
);

create table public.nexus_circle_members (
  circle_id uuid not null references public.nexus_circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (circle_id, user_id)
);

create table public.nexus_entries (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.nexus_circles(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null default auth.uid(),
  author_name text not null check (char_length(trim(author_name)) between 1 and 60),
  kind text not null check (kind in ('research', 'trip')),
  title text not null check (char_length(trim(title)) between 1 and 140),
  body text not null check (char_length(trim(body)) between 1 and 6000),
  source_url text check (source_url is null or (char_length(source_url) <= 2000 and source_url ~ '^https?://')),
  created_at timestamptz not null default now()
);

create index nexus_circles_owner on public.nexus_circles (owner_id);
create index nexus_members_user on public.nexus_circle_members (user_id);
create index nexus_entries_circle on public.nexus_entries (circle_id, created_at desc);

create table nexus_private.circle_invites (
  code uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.nexus_circles(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz
);
create index nexus_invites_circle on nexus_private.circle_invites (circle_id);

alter table public.nexus_library enable row level security;
alter table public.nexus_circles enable row level security;
alter table public.nexus_circle_members enable row level security;
alter table public.nexus_entries enable row level security;
alter table nexus_private.circle_invites enable row level security;

revoke all on public.nexus_library, public.nexus_circles, public.nexus_circle_members, public.nexus_entries
  from public, anon, authenticated;
grant select on public.nexus_library, public.nexus_circles, public.nexus_circle_members, public.nexus_entries
  to authenticated;
grant insert (name, description) on public.nexus_circles to authenticated;
grant insert (circle_id, author_name, kind, title, body, source_url) on public.nexus_entries to authenticated;
grant delete on public.nexus_circle_members, public.nexus_entries to authenticated;
grant all on public.nexus_library to service_role;

create policy "Read published member library" on public.nexus_library
  for select to authenticated using (published_at <= now());

create policy "Read own circle membership" on public.nexus_circle_members
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Leave own circle" on public.nexus_circle_members
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "Read circles you belong to" on public.nexus_circles
  for select to authenticated using (
    owner_id = (select auth.uid()) or exists (
      select 1 from public.nexus_circle_members m where m.circle_id = nexus_circles.id
    )
  );
create policy "Create an owned circle" on public.nexus_circles
  for insert to authenticated with check (owner_id = (select auth.uid()));

create policy "Read your circle entries" on public.nexus_entries
  for select to authenticated using (
    exists (select 1 from public.nexus_circles c where c.id = nexus_entries.circle_id)
  );
create policy "Add entries to your circles" on public.nexus_entries
  for insert to authenticated with check (
    author_id = (select auth.uid()) and
    exists (select 1 from public.nexus_circles c where c.id = nexus_entries.circle_id)
  );
create policy "Remove your entries in your circles" on public.nexus_entries
  for delete to authenticated using (
    author_id = (select auth.uid()) and
    exists (select 1 from public.nexus_circles c where c.id = nexus_entries.circle_id)
  );

create function public.nexus_create_invite(target_circle uuid) returns uuid
  language plpgsql security definer set search_path = '' as $$
declare invite_code uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.nexus_circles where id = target_circle and owner_id = auth.uid()
  ) then
    raise exception 'Only the circle owner can create an invitation.';
  end if;
  insert into nexus_private.circle_invites (circle_id) values (target_circle)
    returning code into invite_code;
  return invite_code;
end;
$$;

create function public.nexus_accept_invite(invite_code uuid) returns uuid
  language plpgsql security definer set search_path = '' as $$
declare target_circle uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in before accepting an invitation.';
  end if;
  update nexus_private.circle_invites set used_at = now()
    where code = invite_code and used_at is null and expires_at > now()
    returning circle_id into target_circle;
  if target_circle is null then
    raise exception 'That invitation has expired or already been used.';
  end if;
  insert into public.nexus_circle_members (circle_id, user_id)
    values (target_circle, auth.uid()) on conflict do nothing;
  return target_circle;
end;
$$;

revoke all on function public.nexus_create_invite(uuid), public.nexus_accept_invite(uuid)
  from public, anon, authenticated;
grant execute on function public.nexus_create_invite(uuid), public.nexus_accept_invite(uuid)
  to authenticated;

insert into storage.buckets (id, name, public) values ('nexus-library', 'nexus-library', false);
create policy "Members can read published Nexus library media" on storage.objects
  for select to authenticated using (
    bucket_id = 'nexus-library' and exists (
      select 1 from public.nexus_library l where l.media_path = objects.name and l.published_at <= now()
    )
  );

commit;
