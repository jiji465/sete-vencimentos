-- Fix RLS policies to use proper header-based token validation
-- Add secure client edit function

-- First, update RLS policies to properly handle token header
DROP POLICY IF EXISTS "Public calendar access via share token" ON fiscal_calendars;
DROP POLICY IF EXISTS "Public events access via share token" ON fiscal_events;

-- Add RLS policy for calendars with proper header handling
CREATE POLICY "Public calendar access via share token"
ON fiscal_calendars FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM validate_share_token(
      COALESCE(
        (current_setting('request.headers', true)::json->>'x-share-token'),
        current_setting('app.share_token', true)
      ),
      id,
      NULL
    ) AS v
    WHERE v.valid = true
  )
);

-- Add RLS policy for events with proper header handling  
CREATE POLICY "Public events access via share token"
ON fiscal_events FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM validate_share_token(
      COALESCE(
        (current_setting('request.headers', true)::json->>'x-share-token'),
        current_setting('app.share_token', true)
      ),
      calendar_id,
      NULL
    ) AS v
    WHERE v.valid = true
  )
);

-- Add policy for editing calendars via token
CREATE POLICY "Public calendar edit via share token"
ON fiscal_calendars FOR UPDATE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM validate_share_token(
      COALESCE(
        (current_setting('request.headers', true)::json->>'x-share-token'),
        current_setting('app.share_token', true)
      ),
      id,
      NULL
    ) AS v
    WHERE v.valid = true AND v.scope = 'edit'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM validate_share_token(
      COALESCE(
        (current_setting('request.headers', true)::json->>'x-share-token'),
        current_setting('app.share_token', true)
      ),
      id,
      NULL
    ) AS v
    WHERE v.valid = true AND v.scope = 'edit'
  )
);

-- Add policies for editing events via token
CREATE POLICY "Public events insert via share token"
ON fiscal_events FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM validate_share_token(
      COALESCE(
        (current_setting('request.headers', true)::json->>'x-share-token'),
        current_setting('app.share_token', true)
      ),
      calendar_id,
      NULL
    ) AS v
    WHERE v.valid = true AND v.scope = 'edit'
  )
);

CREATE POLICY "Public events update via share token"
ON fiscal_events FOR UPDATE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM validate_share_token(
      COALESCE(
        (current_setting('request.headers', true)::json->>'x-share-token'),
        current_setting('app.share_token', true)
      ),
      calendar_id,
      NULL
    ) AS v
    WHERE v.valid = true AND v.scope = 'edit'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM validate_share_token(
      COALESCE(
        (current_setting('request.headers', true)::json->>'x-share-token'),
        current_setting('app.share_token', true)
      ),
      calendar_id,
      NULL
    ) AS v
    WHERE v.valid = true AND v.scope = 'edit'
  )
);

CREATE POLICY "Public events delete via share token"
ON fiscal_events FOR DELETE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM validate_share_token(
      COALESCE(
        (current_setting('request.headers', true)::json->>'x-share-token'),
        current_setting('app.share_token', true)
      ),
      calendar_id,
      NULL
    ) AS v
    WHERE v.valid = true AND v.scope = 'edit'
  )
);

-- Create secure function for client editing
CREATE OR REPLACE FUNCTION client_save_calendar_data(
  p_token TEXT,
  p_calendar_id TEXT,
  p_client_name TEXT,
  p_client_cnpj TEXT,
  p_events JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_validation RECORD;
  event_item JSONB;
  existing_event_ids TEXT[];
  new_event_ids TEXT[];
  events_to_delete TEXT[];
BEGIN
  -- Validate token
  SELECT * INTO token_validation 
  FROM validate_share_token(p_token, p_calendar_id, NULL) 
  LIMIT 1;
  
  IF NOT token_validation.valid OR token_validation.scope != 'edit' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token inválido ou sem permissão de edição');
  END IF;
  
  -- Update calendar info
  UPDATE fiscal_calendars 
  SET client_name = p_client_name, client_cnpj = p_client_cnpj, updated_at = NOW()
  WHERE id = p_calendar_id;
  
  -- Get existing event IDs
  SELECT ARRAY(SELECT id FROM fiscal_events WHERE calendar_id = p_calendar_id) INTO existing_event_ids;
  
  -- Get new event IDs from JSON
  SELECT ARRAY(SELECT jsonb_array_elements_text(jsonb_path_query_array(p_events, '$[*].id'))) INTO new_event_ids;
  
  -- Find events to delete
  SELECT ARRAY(SELECT unnest(existing_event_ids) EXCEPT SELECT unnest(new_event_ids)) INTO events_to_delete;
  
  -- Delete removed events
  IF array_length(events_to_delete, 1) > 0 THEN
    DELETE FROM fiscal_events WHERE id = ANY(events_to_delete);
  END IF;
  
  -- Upsert events
  FOR event_item IN SELECT * FROM jsonb_array_elements(p_events)
  LOOP
    INSERT INTO fiscal_events (
      id, calendar_id, tax_name, title, date, value, type, created_at, updated_at
    ) VALUES (
      event_item->>'id',
      p_calendar_id,
      event_item->>'taxName',
      COALESCE(event_item->>'title', ''),
      (event_item->>'date')::date,
      (event_item->>'value')::numeric,
      event_item->>'type',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      tax_name = EXCLUDED.tax_name,
      title = EXCLUDED.title,
      date = EXCLUDED.date,
      value = EXCLUDED.value,
      type = EXCLUDED.type,
      updated_at = NOW();
  END LOOP;
  
  RETURN jsonb_build_object('success', true, 'message', 'Dados salvos com sucesso');
END;
$$;