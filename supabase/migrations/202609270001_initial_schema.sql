-- Sakhi Cycle foundation. Cycle and symptom details are sensitive health data.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cycle_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  average_cycle_length smallint check (average_cycle_length between 15 and 60),
  average_period_length smallint check (average_period_length between 1 and 15),
  last_period_start date,
  tracking_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  flow_level text check (flow_level in ('spotting', 'light', 'medium', 'heavy')),
  symptoms text[] not null default '{}',
  mood text check (mood in ('great', 'good', 'okay', 'low', 'awful')),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index if not exists daily_logs_user_date_idx on public.daily_logs (user_id, log_date desc);

alter table public.profiles enable row level security;
alter table public.cycle_settings enable row level security;
alter table public.daily_logs enable row level security;

-- RLS decides which rows an authenticated user can access; grants expose only these operations.
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.cycle_settings to authenticated;
grant select, insert, update, delete on public.daily_logs to authenticated;

create policy "Users can read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Users can create own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users can update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Users can manage own cycle settings" on public.cycle_settings for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users can manage own daily logs" on public.daily_logs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Keep the trigger helper outside the exposed public schema and prevent direct API calls.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.handle_new_user();
