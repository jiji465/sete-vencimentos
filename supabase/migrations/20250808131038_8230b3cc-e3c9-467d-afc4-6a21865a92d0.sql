-- Create calendar and events tables for sharing across devices
-- Function to update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Calendars table
create table if not exists public.fiscal_calendars (
  id text primary key,
  calendar_title text not null default 'Calendário de Impostos',
  client_name text,
  client_cnpj text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Events table
create table if not exists public.fiscal_events (
  id text primary key,
  calendar_id text not null references public.fiscal_calendars(id) on delete cascade,
  tax_name text not null,
  title text,
  date date not null,
  value numeric(14,2) not null default 0,
  type text not null check (type in ('imposto','parcelamento')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.fiscal_calendars enable row level security;
alter table public.fiscal_events enable row level security;

-- Policies: public read and write via unguessable IDs
-- Select policies
create policy if not exists "Calendars are viewable by anyone"
  on public.fiscal_calendars for select
  using (true);

create policy if not exists "Events are viewable by anyone"
  on public.fiscal_events for select
  using (true);

-- Insert policies
create policy if not exists "Anyone can insert calendars"
  on public.fiscal_calendars for insert
  with check (true);

create policy if not exists "Anyone can insert events"
  on public.fiscal_events for insert
  with check (true);

-- Update policies
create policy if not exists "Anyone can update calendars"
  on public.fiscal_calendars for update
  using (true);

create policy if not exists "Anyone can update events"
  on public.fiscal_events for update
  using (true);

-- Delete policies
create policy if not exists "Anyone can delete calendars"
  on public.fiscal_calendars for delete
  using (true);

create policy if not exists "Anyone can delete events"
  on public.fiscal_events for delete
  using (true);

-- Triggers for updated_at
create trigger if not exists trg_fiscal_calendars_updated_at
before update on public.fiscal_calendars
for each row execute function public.update_updated_at_column();

create trigger if not exists trg_fiscal_events_updated_at
before update on public.fiscal_events
for each row execute function public.update_updated_at_column();