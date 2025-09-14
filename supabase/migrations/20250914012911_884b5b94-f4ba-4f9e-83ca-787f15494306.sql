-- Enable pgcrypto extension for digest function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fix RLS policies for calendar_share_tokens to allow proper token creation
DROP POLICY IF EXISTS "Only calendar owner can manage share tokens" ON calendar_share_tokens;

-- New policies for share tokens
CREATE POLICY "Calendar owners can view their share tokens" ON calendar_share_tokens
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM fiscal_calendars c 
    WHERE c.id = calendar_share_tokens.calendar_id 
    AND c.owner_id = auth.uid()
  )
);

CREATE POLICY "Calendar owners can create share tokens" ON calendar_share_tokens
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM fiscal_calendars c 
    WHERE c.id = calendar_share_tokens.calendar_id 
    AND c.owner_id = auth.uid()
  )
);

CREATE POLICY "Calendar owners can update their share tokens" ON calendar_share_tokens
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM fiscal_calendars c 
    WHERE c.id = calendar_share_tokens.calendar_id 
    AND c.owner_id = auth.uid()
  )
);

CREATE POLICY "Calendar owners can delete their share tokens" ON calendar_share_tokens
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM fiscal_calendars c 
    WHERE c.id = calendar_share_tokens.calendar_id 
    AND c.owner_id = auth.uid()
  )
);

-- Also add missing created_by column population
ALTER TABLE calendar_share_tokens 
ALTER COLUMN created_by SET DEFAULT auth.uid();