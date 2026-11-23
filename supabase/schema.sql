-- One private dashboard snapshot per Supabase account.
create table if not exists public.nexus_dashboard_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default pg_catalog.now()
);

alter table public.nexus_dashboard_state enable row level security;

grant select, insert, update, delete on public.nexus_dashboard_state to authenticated;

drop policy if exists "Read own dashboard state" on public.nexus_dashboard_state;
create policy "Read own dashboard state"
  on public.nexus_dashboard_state
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Insert own dashboard state" on public.nexus_dashboard_state;
create policy "Insert own dashboard state"
  on public.nexus_dashboard_state
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Update own dashboard state" on public.nexus_dashboard_state;
create policy "Update own dashboard state"
  on public.nexus_dashboard_state
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Delete own dashboard state" on public.nexus_dashboard_state;
create policy "Delete own dashboard state"
  on public.nexus_dashboard_state
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_nexus_dashboard_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists nexus_dashboard_updated_at on public.nexus_dashboard_state;
create trigger nexus_dashboard_updated_at
  before update on public.nexus_dashboard_state
  for each row execute function public.set_nexus_dashboard_updated_at();

