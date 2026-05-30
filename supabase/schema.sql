-- Enable extension for UUID generation (usually already enabled in Supabase)
create extension if not exists pgcrypto;

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled Plan',
  created_at timestamptz not null default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  date date not null,
  status text not null check (status in ('available', 'maybe', 'unavailable')),
  note text,
  updated_at timestamptz not null default now(),
  unique (board_id, participant_id, date)
);

create index if not exists idx_participants_board_id on public.participants(board_id);
create index if not exists idx_availability_board_id on public.availability(board_id);
create index if not exists idx_availability_board_date on public.availability(board_id, date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_availability_updated_at
before update on public.availability
for each row
execute function public.set_updated_at();

alter table public.boards enable row level security;
alter table public.participants enable row level security;
alter table public.availability enable row level security;

-- MVP policies: allow anonymous read/write so app works without auth.
-- IMPORTANT: tighten these policies before production.

do $$ begin
  create policy "mvp_public_read_boards" on public.boards for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "mvp_public_insert_boards" on public.boards for insert with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "mvp_public_update_boards" on public.boards for update using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "mvp_public_read_participants" on public.participants
    for select using (exists (select 1 from public.boards b where b.id = board_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "mvp_public_insert_participants" on public.participants
    for insert with check (exists (select 1 from public.boards b where b.id = board_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "mvp_public_update_participants" on public.participants
    for update
    using (exists (select 1 from public.boards b where b.id = board_id))
    with check (exists (select 1 from public.boards b where b.id = board_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "mvp_public_delete_participants" on public.participants
    for delete using (exists (select 1 from public.boards b where b.id = board_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "mvp_public_read_availability" on public.availability
    for select using (exists (select 1 from public.boards b where b.id = board_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "mvp_public_insert_availability" on public.availability
    for insert with check (exists (select 1 from public.boards b where b.id = board_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "mvp_public_update_availability" on public.availability
    for update
    using (exists (select 1 from public.boards b where b.id = board_id))
    with check (exists (select 1 from public.boards b where b.id = board_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "mvp_public_delete_availability" on public.availability
    for delete using (exists (select 1 from public.boards b where b.id = board_id));
exception when duplicate_object then null; end $$;
