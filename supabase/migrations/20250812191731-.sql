-- Tighten RLS: restrict SELECT to authenticated owner only, removing public readability

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.fiscal_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_events ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive public SELECT policies
DROP POLICY IF EXISTS "Calendars are viewable by anyone" ON public.fiscal_calendars;
DROP POLICY IF EXISTS "Events are viewable by anyone" ON public.fiscal_events;

-- Create strict SELECT policies limited to the calendar owner
CREATE POLICY "Calendars selectable by owner"
ON public.fiscal_calendars
FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Events selectable by calendar owner"
ON public.fiscal_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.fiscal_calendars c
    WHERE c.id = fiscal_events.calendar_id
      AND c.owner_id = auth.uid()
  )
);
