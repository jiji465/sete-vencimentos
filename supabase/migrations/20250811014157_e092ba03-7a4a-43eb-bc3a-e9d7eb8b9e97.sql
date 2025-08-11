
-- 1) Coluna de dono e índices
alter table public.fiscal_calendars
  add column if not exists owner_id uuid;

create index if not exists idx_fiscal_calendars_owner on public.fiscal_calendars(owner_id);

-- 2) FK e deleção em cascata para eventos
-- Se já existir uma constraint, ajuste/drope-a antes. Aqui criamos se não existir.
alter table public.fiscal_events
  drop constraint if exists fiscal_events_calendar_fk;

alter table public.fiscal_events
  add constraint fiscal_events_calendar_fk
  foreign key (calendar_id)
  references public.fiscal_calendars(id)
  on delete cascade;

create index if not exists idx_fiscal_events_calendar on public.fiscal_events(calendar_id);

-- 3) Triggers de updated_at (a função já existe)
drop trigger if exists set_timestamp_fiscal_calendars on public.fiscal_calendars;
create trigger set_timestamp_fiscal_calendars
before update on public.fiscal_calendars
for each row
execute function public.update_updated_at_column();

drop trigger if exists set_timestamp_fiscal_events on public.fiscal_events;
create trigger set_timestamp_fiscal_events
before update on public.fiscal_events
for each row
execute function public.update_updated_at_column();

-- 4) RLS: substituir políticas permissivas por políticas seguras
alter table public.fiscal_calendars enable row level security;
alter table public.fiscal_events enable row level security;

-- Drop policies atuais (permissivas)
drop policy if exists "Anyone can delete calendars" on public.fiscal_calendars;
drop policy if exists "Anyone can insert calendars" on public.fiscal_calendars;
drop policy if exists "Anyone can update calendars" on public.fiscal_calendars;
drop policy if exists "Calendars are viewable by anyone" on public.fiscal_calendars;

drop policy if exists "Anyone can delete events" on public.fiscal_events;
drop policy if exists "Anyone can insert events" on public.fiscal_events;
drop policy if exists "Anyone can update events" on public.fiscal_events;
drop policy if exists "Events are viewable by anyone" on public.fiscal_events;

-- Novas políticas: fiscal_calendars
-- Leitura pública (links continuam visíveis sem login)
create policy "Calendars are viewable by anyone"
on public.fiscal_calendars
for select
using (true);

-- Inserção: apenas autenticado e dono = auth.uid()
create policy "Only owner can insert calendars"
on public.fiscal_calendars
for insert
to authenticated
with check (owner_id = auth.uid());

-- Update: dono pode editar, e transição permite assumir calendários sem dono.
-- USING permite o update se o registro é do dono ou ainda sem dono.
-- WITH CHECK exige que o registro atualizado tenha owner_id = auth.uid() (assumindo a posse).
create policy "Only owner can update calendars"
on public.fiscal_calendars
for update
to authenticated
using (owner_id = auth.uid() or owner_id is null)
with check (owner_id = auth.uid());

-- Delete: apenas dono
create policy "Only owner can delete calendars"
on public.fiscal_calendars
for delete
to authenticated
using (owner_id = auth.uid());

-- Novas políticas: fiscal_events
-- Leitura pública (eventos visíveis por link)
create policy "Events are viewable by anyone"
on public.fiscal_events
for select
using (true);

-- Insert: apenas se o usuário é dono do calendário pai
create policy "Only calendar owner can insert events"
on public.fiscal_events
for insert
to authenticated
with check (
  exists (
    select 1
    from public.fiscal_calendars c
    where c.id = fiscal_events.calendar_id
      and c.owner_id = auth.uid()
  )
);

-- Update: apenas se o usuário é dono do calendário pai
create policy "Only calendar owner can update events"
on public.fiscal_events
for update
to authenticated
using (
  exists (
    select 1
    from public.fiscal_calendars c
    where c.id = fiscal_events.calendar_id
      and c.owner_id = auth.uid()
  )
);

-- Delete: apenas se o usuário é dono do calendário pai
create policy "Only calendar owner can delete events"
on public.fiscal_events
for delete
to authenticated
using (
  exists (
    select 1
    from public.fiscal_calendars c
    where c.id = fiscal_events.calendar_id
      and c.owner_id = auth.uid()
  )
);
