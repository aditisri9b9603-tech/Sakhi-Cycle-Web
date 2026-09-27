-- Product features: richer logs, sharing, community, companion history.
-- Additive only. Does not drop existing tables or policies from 202609270001.

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

alter table public.daily_logs
  add column if not exists energy text,
  add column if not exists sleep_hours numeric(3, 1);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'daily_logs_energy_check'
      and conrelid = 'public.daily_logs'::regclass
  ) then
    alter table public.daily_logs
      add constraint daily_logs_energy_check
      check (energy is null or energy in ('low', 'okay', 'good', 'high'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'daily_logs_sleep_hours_check'
      and conrelid = 'public.daily_logs'::regclass
  ) then
    alter table public.daily_logs
      add constraint daily_logs_sleep_hours_check
      check (sleep_hours is null or (sleep_hours >= 0 and sleep_hours <= 24));
  end if;
end $$;

create table if not exists public.share_links (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  recipient_email text not null check (char_length(recipient_email) between 3 and 254),
  recipient_user_id uuid references auth.users (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  share_cycle_estimates boolean not null default false,
  share_mood_summary boolean not null default false,
  share_symptom_summary boolean not null default false,
  share_flow_summary boolean not null default false,
  consent_acknowledged_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    share_cycle_estimates
    or share_mood_summary
    or share_symptom_summary
    or share_flow_summary
  )
);

create index if not exists share_links_owner_idx on public.share_links (owner_id, created_at desc);
create index if not exists share_links_recipient_idx on public.share_links (recipient_user_id, status);

create table if not exists public.companion_messages (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 8000),
  created_at timestamptz not null default now()
);

create index if not exists companion_messages_user_idx
  on public.companion_messages (user_id, created_at desc);

create table if not exists public.community_posts (
  id uuid primary key default extensions.gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  author_label text not null check (char_length(author_label) between 1 and 40),
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 10 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_created_idx on public.community_posts (created_at desc);

create table if not exists public.community_comments (
  id uuid primary key default extensions.gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_label text not null check (char_length(author_label) between 1 and 40),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists community_comments_post_idx
  on public.community_comments (post_id, created_at);

create table if not exists public.community_reports (
  id uuid primary key default extensions.gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  post_id uuid references public.community_posts (id) on delete cascade,
  comment_id uuid references public.community_comments (id) on delete cascade,
  reason text not null check (reason in ('harmful', 'identifying', 'spam', 'other')),
  details text check (char_length(details) <= 1000),
  created_at timestamptz not null default now(),
  check (post_id is not null or comment_id is not null)
);

create unique index if not exists community_reports_post_unique
  on public.community_reports (reporter_id, post_id)
  where post_id is not null;
create unique index if not exists community_reports_comment_unique
  on public.community_reports (reporter_id, comment_id)
  where comment_id is not null;

alter table public.share_links enable row level security;
alter table public.companion_messages enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reports enable row level security;

grant select, insert, update, delete on public.share_links to authenticated;
grant select, insert, delete on public.companion_messages to authenticated;
grant select, insert, update, delete on public.community_posts to authenticated;
grant select, insert, delete on public.community_comments to authenticated;
grant select, insert on public.community_reports to authenticated;

drop policy if exists "Owners manage share links" on public.share_links;
create policy "Owners manage share links" on public.share_links
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Recipients can read their shares" on public.share_links;
create policy "Recipients can read their shares" on public.share_links
  for select to authenticated
  using ((select auth.uid()) = recipient_user_id);

drop policy if exists "Recipients can leave a share" on public.share_links;
create policy "Recipients can leave a share" on public.share_links
  for update to authenticated
  using ((select auth.uid()) = recipient_user_id)
  with check ((select auth.uid()) = recipient_user_id and status = 'revoked');

drop policy if exists "Users manage own companion messages" on public.companion_messages;
create policy "Users manage own companion messages" on public.companion_messages
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Members can read community posts" on public.community_posts;
create policy "Members can read community posts" on public.community_posts
  for select to authenticated
  using (true);

drop policy if exists "Members can create community posts" on public.community_posts;
create policy "Members can create community posts" on public.community_posts
  for insert to authenticated
  with check ((select auth.uid()) = author_id);

drop policy if exists "Authors can update own posts" on public.community_posts;
create policy "Authors can update own posts" on public.community_posts
  for update to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

drop policy if exists "Authors can delete own posts" on public.community_posts;
create policy "Authors can delete own posts" on public.community_posts
  for delete to authenticated
  using ((select auth.uid()) = author_id);

drop policy if exists "Members can read community comments" on public.community_comments;
create policy "Members can read community comments" on public.community_comments
  for select to authenticated
  using (true);

drop policy if exists "Members can create comments" on public.community_comments;
create policy "Members can create comments" on public.community_comments
  for insert to authenticated
  with check ((select auth.uid()) = author_id);

drop policy if exists "Authors can delete own comments" on public.community_comments;
create policy "Authors can delete own comments" on public.community_comments
  for delete to authenticated
  using ((select auth.uid()) = author_id);

drop policy if exists "Users can file and read own reports" on public.community_reports;
create policy "Users can file and read own reports" on public.community_reports
  for select to authenticated
  using ((select auth.uid()) = reporter_id);

drop policy if exists "Users can create reports" on public.community_reports;
create policy "Users can create reports" on public.community_reports
  for insert to authenticated
  with check ((select auth.uid()) = reporter_id);

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.claim_share_invites()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed integer;
  caller uuid := (select auth.uid());
  caller_email text := (select auth.jwt() ->> 'email');
begin
  if caller is null or caller_email is null then
    raise exception 'Not authenticated';
  end if;

  update public.share_links
  set recipient_user_id = caller,
      status = 'active',
      updated_at = now()
  where status = 'pending'
    and recipient_user_id is null
    and lower(recipient_email) = lower(caller_email);

  get diagnostics claimed = row_count;
  return claimed;
end;
$$;

revoke all on function public.claim_share_invites() from public, anon;
grant execute on function public.claim_share_invites() to authenticated;

create or replace function public.shared_with_me()
returns table (
  share_id uuid,
  owner_label text,
  share_cycle_estimates boolean,
  share_mood_summary boolean,
  share_symptom_summary boolean,
  share_flow_summary boolean,
  average_cycle_length smallint,
  average_period_length smallint,
  last_period_start date,
  mood_counts jsonb,
  top_symptoms jsonb,
  flow_days_last_30 integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    s.id,
    coalesce(nullif(p.display_name, ''), 'A trusted person'),
    s.share_cycle_estimates,
    s.share_mood_summary,
    s.share_symptom_summary,
    s.share_flow_summary,
    case when s.share_cycle_estimates then cs.average_cycle_length end,
    case when s.share_cycle_estimates then cs.average_period_length end,
    case when s.share_cycle_estimates then cs.last_period_start end,
    case when s.share_mood_summary then (
      select coalesce(jsonb_object_agg(mood, cnt), '{}'::jsonb)
      from (
        select dl.mood, count(*)::int as cnt
        from public.daily_logs dl
        where dl.user_id = s.owner_id
          and dl.mood is not null
          and dl.log_date >= (current_date - 30)
        group by dl.mood
      ) mood_rows
    ) end,
    case when s.share_symptom_summary then (
      select coalesce(jsonb_agg(jsonb_build_object('symptom', symptom, 'count', cnt)), '[]'::jsonb)
      from (
        select symptom, count(*)::int as cnt
        from public.daily_logs dl
        cross join lateral unnest(dl.symptoms) as symptom
        where dl.user_id = s.owner_id
          and dl.log_date >= (current_date - 30)
        group by symptom
        order by cnt desc
        limit 5
      ) symptom_rows
    ) end,
    case when s.share_flow_summary then (
      select count(*)::int
      from public.daily_logs dl
      where dl.user_id = s.owner_id
        and dl.flow_level is not null
        and dl.log_date >= (current_date - 30)
    ) end
  from public.share_links s
  join public.profiles p on p.id = s.owner_id
  left join public.cycle_settings cs on cs.user_id = s.owner_id
  where s.status = 'active'
    and s.recipient_user_id = (select auth.uid());
$$;

revoke all on function public.shared_with_me() from public, anon;
grant execute on function public.shared_with_me() to authenticated;
