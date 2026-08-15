-- LexCase — Supabase schema
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query → Run).
-- Safe to re-run: every statement is guarded so it won't error on a second run.

-- ------------------------------------------------------------------ tables --

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_number text not null,
  title text not null,
  court text not null,
  filing_date date not null,
  case_type text not null default 'Civil Suit',
  counsel_for text not null default '',
  stage text not null default 'Filed',
  status text not null default 'Active',
  priority text not null default 'Medium',
  notes text,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  position int not null default 0,
  name text not null,
  role text not null,
  phone text,
  email text
);

create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  title text not null,
  date date not null,
  description text not null default '',
  type text not null default 'other',
  created_at timestamptz not null default now()
);

create table if not exists public.hearings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  date timestamptz not null,
  purpose text not null,
  court text not null,
  counsel_for text,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,
  title text not null,
  due_date date,
  status text not null default 'Pending',
  priority text,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  name text not null,
  size bigint not null default 0,
  mime_type text not null default 'application/octet-stream',
  storage_path text not null,
  uploaded_at timestamptz not null default now()
);

create index if not exists cases_user_id_idx on public.cases (user_id);
create index if not exists parties_case_id_idx on public.parties (case_id);
create index if not exists timeline_events_case_id_idx on public.timeline_events (case_id);
create index if not exists hearings_case_id_idx on public.hearings (case_id);
create index if not exists hearings_user_id_idx on public.hearings (user_id);
create index if not exists tasks_case_id_idx on public.tasks (case_id);
create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists documents_case_id_idx on public.documents (case_id);

-- --------------------------------------------------------------------- RLS --
-- Every table: a signed-in user may only see/change rows where user_id = their
-- own auth.uid(). This is enforced in Postgres itself, not just the app, so it
-- holds even if a request is crafted by hand from the browser.

alter table public.cases enable row level security;
alter table public.parties enable row level security;
alter table public.timeline_events enable row level security;
alter table public.hearings enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;

drop policy if exists "own cases" on public.cases;
create policy "own cases" on public.cases for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own parties" on public.parties;
create policy "own parties" on public.parties for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own timeline_events" on public.timeline_events;
create policy "own timeline_events" on public.timeline_events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own hearings" on public.hearings;
create policy "own hearings" on public.hearings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own tasks" on public.tasks;
create policy "own tasks" on public.tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own documents" on public.documents;
create policy "own documents" on public.documents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------- storage --
-- Private bucket for uploaded case documents. Objects are stored at
-- user/{user_id}/case/{case_id}/{filename}, and the policies below only allow
-- a user to touch objects under their own user/{their_uid}/ prefix.

insert into storage.buckets (id, name, public)
  values ('case-documents', 'case-documents', false)
  on conflict (id) do nothing;

drop policy if exists "own storage objects select" on storage.objects;
create policy "own storage objects select" on storage.objects for select
  using (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = 'user'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "own storage objects insert" on storage.objects;
create policy "own storage objects insert" on storage.objects for insert
  with check (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = 'user'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "own storage objects delete" on storage.objects;
create policy "own storage objects delete" on storage.objects for delete
  using (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = 'user'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
