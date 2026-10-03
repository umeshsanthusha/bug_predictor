-- CrossBugSense: Supabase Auth-backed schema (profiles + chats with RLS)
-- Applied to project oyhbwkoylcddgpcqzmdk via Supabase MCP (migration: create_cbs_auth_schema).
-- Keep in sync with the Supabase migration history; this file is the repo's reference copy.

-- ── profiles: public mirror of auth.users for app-level fields ─────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default 'Anonymous',
  email text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile on signup, seeded from signup metadata
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── chats: saved analysis sessions (replaces the SQLite chats table) ──────
create table public.chats (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  model text not null default '',
  payload jsonb not null default '{}'::jsonb,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create index chats_user_idx on public.chats (user_id, created_at desc);

alter table public.chats enable row level security;

create policy "chats_select_own" on public.chats
  for select using (auth.uid() = user_id);

create policy "chats_insert_own" on public.chats
  for insert with check (auth.uid() = user_id);

create policy "chats_update_own" on public.chats
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "chats_delete_own" on public.chats
  for delete using (auth.uid() = user_id);

-- ── self-service account deletion (replaces DELETE /api/auth/account) ─────
create function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.chats where user_id = auth.uid();
  delete from public.profiles where id = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_account() from public;
grant execute on function public.delete_account() to authenticated;
