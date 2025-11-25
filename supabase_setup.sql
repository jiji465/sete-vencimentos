-- 1. Habilitar extensão pgcrypto (necessária para gerar IDs e Hashes)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Criar Tabelas

-- Tabela de Calendários Fiscais
CREATE TABLE IF NOT EXISTS public.fiscal_calendars (
  id text PRIMARY KEY,
  calendar_title text NOT NULL DEFAULT 'Calendário de Impostos',
  client_name text,
  client_cnpj text,
  owner_id uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Eventos Fiscais
CREATE TABLE IF NOT EXISTS public.fiscal_events (
  id text PRIMARY KEY,
  calendar_id text NOT NULL REFERENCES public.fiscal_calendars(id) ON DELETE CASCADE,
  tax_name text NOT NULL,
  title text,
  date date NOT NULL,
  value numeric(14,2) NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('imposto', 'parcelamento')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Tokens de Compartilhamento
CREATE TABLE IF NOT EXISTS public.calendar_share_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_id text NOT NULL REFERENCES public.fiscal_calendars(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  scope text NOT NULL DEFAULT 'view',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid()
);

-- 3. Criar Índices para Performance
CREATE INDEX IF NOT EXISTS idx_fiscal_calendars_owner ON public.fiscal_calendars(owner_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_events_calendar ON public.fiscal_events(calendar_id);

-- 4. Funções Auxiliares

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_fiscal_calendars_updated_at ON public.fiscal_calendars;
CREATE TRIGGER update_fiscal_calendars_updated_at BEFORE UPDATE ON public.fiscal_calendars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_fiscal_events_updated_at ON public.fiscal_events;
CREATE TRIGGER update_fiscal_events_updated_at BEFORE UPDATE ON public.fiscal_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_share_tokens_updated_at ON public.calendar_share_tokens;
CREATE TRIGGER update_calendar_share_tokens_updated_at BEFORE UPDATE ON public.calendar_share_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para validar token de compartilhamento
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
  -- Hash do token fornecido para comparação
  token_hash_check := encode(digest(p_token, 'sha256'), 'hex');
  
  -- Busca token correspondente
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

-- Função segura para salvar dados via cliente (com token)
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
  -- Valida token
  SELECT * INTO token_validation 
  FROM validate_share_token(p_token, p_calendar_id, NULL) 
  LIMIT 1;
  
  IF NOT token_validation.valid OR token_validation.scope != 'edit' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token inválido ou sem permissão de edição');
  END IF;
  
  -- Atualiza info do calendário
  UPDATE fiscal_calendars 
  SET client_name = p_client_name, client_cnpj = p_client_cnpj, updated_at = NOW()
  WHERE id = p_calendar_id;
  
  -- Sincroniza eventos (Identifica deletados, novos e atualizados)
  SELECT ARRAY(SELECT id FROM fiscal_events WHERE calendar_id = p_calendar_id) INTO existing_event_ids;
  SELECT ARRAY(SELECT jsonb_array_elements_text(jsonb_path_query_array(p_events, '$[*].id'))) INTO new_event_ids;
  SELECT ARRAY(SELECT unnest(existing_event_ids) EXCEPT SELECT unnest(new_event_ids)) INTO events_to_delete;
  
  IF array_length(events_to_delete, 1) > 0 THEN
    DELETE FROM fiscal_events WHERE id = ANY(events_to_delete);
  END IF;
  
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

-- 5. Configurar Segurança (RLS Policies)

ALTER TABLE public.fiscal_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_share_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas para CALENDÁRIOS
DROP POLICY IF EXISTS "Calendars selectable by owner" ON public.fiscal_calendars;
CREATE POLICY "Calendars selectable by owner" ON public.fiscal_calendars FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Only owner can insert calendars" ON public.fiscal_calendars;
CREATE POLICY "Only owner can insert calendars" ON public.fiscal_calendars FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Only owner can update calendars" ON public.fiscal_calendars;
CREATE POLICY "Only owner can update calendars" ON public.fiscal_calendars FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Only owner can delete calendars" ON public.fiscal_calendars;
CREATE POLICY "Only owner can delete calendars" ON public.fiscal_calendars FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Política de acesso público via Token (Header x-share-token)
DROP POLICY IF EXISTS "Public calendar access via share token" ON fiscal_calendars;
CREATE POLICY "Public calendar access via share token" ON fiscal_calendars FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM validate_share_token(
      COALESCE(
        (current_setting('request.headers', true)::json->>'x-share-token'),
        current_setting('app.share_token', true)
      ),
      id,
      NULL
    ) AS v WHERE v.valid = true
  )
);

-- Políticas para EVENTOS
DROP POLICY IF EXISTS "Events selectable by calendar owner" ON public.fiscal_events;
CREATE POLICY "Events selectable by calendar owner" ON public.fiscal_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.fiscal_calendars c WHERE c.id = fiscal_events.calendar_id AND c.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Only calendar owner can insert events" ON public.fiscal_events;
CREATE POLICY "Only calendar owner can insert events" ON public.fiscal_events FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.fiscal_calendars c WHERE c.id = fiscal_events.calendar_id AND c.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Only calendar owner can update events" ON public.fiscal_events;
CREATE POLICY "Only calendar owner can update events" ON public.fiscal_events FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.fiscal_calendars c WHERE c.id = fiscal_events.calendar_id AND c.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Only calendar owner can delete events" ON public.fiscal_events;
CREATE POLICY "Only calendar owner can delete events" ON public.fiscal_events FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.fiscal_calendars c WHERE c.id = fiscal_events.calendar_id AND c.owner_id = auth.uid())
);

-- Política de acesso público a Eventos via Token
DROP POLICY IF EXISTS "Public events access via share token" ON fiscal_events;
CREATE POLICY "Public events access via share token" ON fiscal_events FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM validate_share_token(
      COALESCE(
        (current_setting('request.headers', true)::json->>'x-share-token'),
        current_setting('app.share_token', true)
      ),
      calendar_id,
      NULL
    ) AS v WHERE v.valid = true
  )
);

-- Políticas para TOKENS DE COMPARTILHAMENTO
DROP POLICY IF EXISTS "Calendar owners can view their share tokens" ON calendar_share_tokens;
CREATE POLICY "Calendar owners can view their share tokens" ON calendar_share_tokens FOR SELECT USING (
  EXISTS (SELECT 1 FROM fiscal_calendars c WHERE c.id = calendar_share_tokens.calendar_id AND c.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Calendar owners can create share tokens" ON calendar_share_tokens;
CREATE POLICY "Calendar owners can create share tokens" ON calendar_share_tokens FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM fiscal_calendars c WHERE c.id = calendar_share_tokens.calendar_id AND c.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Calendar owners can update their share tokens" ON calendar_share_tokens;
CREATE POLICY "Calendar owners can update their share tokens" ON calendar_share_tokens FOR UPDATE USING (
  EXISTS (SELECT 1 FROM fiscal_calendars c WHERE c.id = calendar_share_tokens.calendar_id AND c.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Calendar owners can delete their share tokens" ON calendar_share_tokens;
CREATE POLICY "Calendar owners can delete their share tokens" ON calendar_share_tokens FOR DELETE USING (
  EXISTS (SELECT 1 FROM fiscal_calendars c WHERE c.id = calendar_share_tokens.calendar_id AND c.owner_id = auth.uid())
);
