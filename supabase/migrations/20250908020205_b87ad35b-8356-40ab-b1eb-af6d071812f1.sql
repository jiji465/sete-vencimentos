-- Create secure sharing system for client access
CREATE TABLE public.calendar_share_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_id TEXT NOT NULL,
  client_id TEXT NOT NULL, -- CNPJ or unique client identifier
  token_hash TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL DEFAULT 'view', -- 'view' or 'edit'
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.calendar_share_tokens ENABLE ROW LEVEL SECURITY;

-- Only calendar owners can manage share tokens
CREATE POLICY "Only calendar owner can manage share tokens" 
ON public.calendar_share_tokens 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM fiscal_calendars c 
    WHERE c.id = calendar_id AND c.owner_id = auth.uid()
  )
);

-- Create function to validate share tokens (security definer for token validation)
CREATE OR REPLACE FUNCTION public.validate_share_token(
  p_token TEXT,
  p_calendar_id TEXT,
  p_client_id TEXT DEFAULT NULL
)
RETURNS TABLE(
  valid BOOLEAN,
  scope TEXT,
  client_id TEXT,
  calendar_id TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_record RECORD;
  token_hash_check TEXT;
BEGIN
  -- Hash the provided token for comparison
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
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$;

-- Add policies for public access via share tokens
CREATE POLICY "Public calendar access via share token" 
ON public.fiscal_calendars 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM validate_share_token(
      current_setting('request.headers', true)::json->>'x-share-token',
      id,
      NULL
    ) WHERE valid = true
  )
);

CREATE POLICY "Public events access via share token" 
ON public.fiscal_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM validate_share_token(
      current_setting('request.headers', true)::json->>'x-share-token',
      calendar_id,
      NULL
    ) WHERE valid = true
  )
);

-- Add trigger for updating timestamps
CREATE TRIGGER update_calendar_share_tokens_updated_at
BEFORE UPDATE ON public.calendar_share_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();