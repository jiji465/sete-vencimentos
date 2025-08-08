-- Retry migration with idempotent policy/trigger creation
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

-- Policies wrapped to avoid duplicate errors
DO $$ BEGIN
  CREATE POLICY "Calendars are viewable by anyone"
    ON public.fiscal_calendars FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Events are viewable by anyone"
    ON public.fiscal_events FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can insert calendars"
    ON public.fiscal_calendars FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can insert events"
    ON public.fiscal_events FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can update calendars"
    ON public.fiscal_calendars FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can update events"
    ON public.fiscal_events FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can delete calendars"
    ON public.fiscal_calendars FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can delete events"
    ON public.fiscal_events FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Triggers for updated_at (idempotent)
DO $$ BEGIN
  CREATE TRIGGER trg_fiscal_calendars_updated_at
  BEFORE UPDATE ON public.fiscal_calendars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_fiscal_events_updated_at
  BEFORE UPDATE ON public.fiscal_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;