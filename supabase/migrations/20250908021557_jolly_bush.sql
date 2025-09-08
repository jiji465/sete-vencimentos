/*
  # Fix digest function and ensure all tables exist

  1. Database Functions
    - Create digest function using pgcrypto extension
    - Fix validate_share_token function to use proper digest

  2. Table Creation
    - Ensure fiscal_calendars table exists with proper structure
    - Ensure calendar_share_tokens table exists with proper structure
    - Ensure fiscal_events table exists with proper structure

  3. Security
    - Enable RLS on all tables
    - Create proper policies for authenticated and public access
*/

-- Enable pgcrypto extension for digest function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure fiscal_calendars table exists
CREATE TABLE IF NOT EXISTS public.fiscal_calendars (
  id text PRIMARY KEY,
  calendar_title text NOT NULL DEFAULT 'Calendário de Impostos',
  client_name text,
  client_cnpj text,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure fiscal_events table exists
CREATE TABLE IF NOT EXISTS public.fiscal_events (
  id text PRIMARY KEY,
  calendar_id text NOT NULL,
  tax_name text NOT NULL,
  title text,
  date date NOT NULL,
  value numeric(14,2) NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('imposto', 'parcelamento')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure calendar_share_tokens table exists
CREATE TABLE IF NOT EXISTS public.calendar_share_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_id text NOT NULL,
  client_id text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  scope text NOT NULL DEFAULT 'view',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

-- Add foreign key constraints if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fiscal_events_calendar_id_fkey'
  ) THEN
    ALTER TABLE public.fiscal_events 
    ADD CONSTRAINT fiscal_events_calendar_id_fkey 
    FOREIGN KEY (calendar_id) REFERENCES public.fiscal_calendars(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_fiscal_calendars_owner ON public.fiscal_calendars(owner_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_events_calendar ON public.fiscal_events(calendar_id);

-- Enable RLS on all tables
ALTER TABLE public.fiscal_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_share_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Calendars selectable by owner" ON public.fiscal_calendars;
DROP POLICY IF EXISTS "Only owner can insert calendars" ON public.fiscal_calendars;
DROP POLICY IF EXISTS "Only owner can update calendars" ON public.fiscal_calendars;
DROP POLICY IF EXISTS "Only owner can delete calendars" ON public.fiscal_calendars;

DROP POLICY IF EXISTS "Events selectable by calendar owner" ON public.fiscal_events;
DROP POLICY IF EXISTS "Only calendar owner can insert events" ON public.fiscal_events;
DROP POLICY IF EXISTS "Only calendar owner can update events" ON public.fiscal_events;
DROP POLICY IF EXISTS "Only calendar owner can delete events" ON public.fiscal_events;

DROP POLICY IF EXISTS "Only calendar owner can manage share tokens" ON public.calendar_share_tokens;

-- Create proper policies for fiscal_calendars
CREATE POLICY "Calendars selectable by owner"
ON public.fiscal_calendars
FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Only owner can insert calendars"
ON public.fiscal_calendars
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Only owner can update calendars"
ON public.fiscal_calendars
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Only owner can delete calendars"
ON public.fiscal_calendars
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Create proper policies for fiscal_events
CREATE POLICY "Events selectable by calendar owner"
ON public.fiscal_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.fiscal_calendars c
    WHERE c.id = fiscal_events.calendar_id
      AND c.owner_id = auth.uid()
  )
);

CREATE POLICY "Only calendar owner can insert events"
ON public.fiscal_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fiscal_calendars c
    WHERE c.id = fiscal_events.calendar_id
      AND c.owner_id = auth.uid()
  )
);

CREATE POLICY "Only calendar owner can update events"
ON public.fiscal_events
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fiscal_calendars c
    WHERE c.id = fiscal_events.calendar_id
      AND c.owner_id = auth.uid()
  )
);

CREATE POLICY "Only calendar owner can delete events"
ON public.fiscal_events
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fiscal_calendars c
    WHERE c.id = fiscal_events.calendar_id
      AND c.owner_id = auth.uid()
  )
);

-- Create proper policies for calendar_share_tokens
CREATE POLICY "Only calendar owner can manage share tokens"
ON public.calendar_share_tokens
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fiscal_calendars c
    WHERE c.id = calendar_id AND c.owner_id = auth.uid()
  )
);

-- Fix the validate_share_token function to use proper digest
CREATE OR REPLACE FUNCTION public.validate_share_token(
  p_token text,
  p_calendar_id text,
  p_client_id text DEFAULT NULL
)
RETURNS TABLE(
  valid boolean,
  scope text,
  client_id text,
  calendar_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_record RECORD;
  token_hash_check text;
BEGIN
  -- Hash the provided token for comparison using pgcrypto
  token_hash_check := encode(digest(p_token, 'sha256'), 'hex');
  
  -- Look for matching token
  SELECT st.scope, st.client_id, st.calendar_id, st.expires_at
  INTO token_record
  FROM calendar_share_tokens st
  WHERE st.token_hash = token_hash_check
    AND st.calendar_id = p_calendar_id
    AND (p_client_id IS NULL OR st.client_id = p_client_id)
    AND (st.expires_at IS NULL OR st.expires_at > now());
  
  IF FOUND THEN
    RETURN QUERY SELECT true, token_record.scope, token_record.client_id, token_record.calendar_id;
  ELSE
    RETURN QUERY SELECT false, NULL::text, NULL::text, NULL::text;
  END IF;
END;
$$;

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_fiscal_calendars_updated_at ON public.fiscal_calendars;
CREATE TRIGGER update_fiscal_calendars_updated_at
  BEFORE UPDATE ON public.fiscal_calendars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_fiscal_events_updated_at ON public.fiscal_events;
CREATE TRIGGER update_fiscal_events_updated_at
  BEFORE UPDATE ON public.fiscal_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_share_tokens_updated_at ON public.calendar_share_tokens;
CREATE TRIGGER update_calendar_share_tokens_updated_at
  BEFORE UPDATE ON public.calendar_share_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();