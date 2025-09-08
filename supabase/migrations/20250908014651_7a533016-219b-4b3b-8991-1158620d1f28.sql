-- Fix critical RLS vulnerability: remove owner_id IS NULL bypass in UPDATE policy
DROP POLICY IF EXISTS "Only owner can update calendars" ON public.fiscal_calendars;

-- Create secure UPDATE policy that only allows calendar owners to update
CREATE POLICY "Only owner can update calendars" 
ON public.fiscal_calendars 
FOR UPDATE 
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Clean up any potentially orphaned calendars and assign them to first authenticated user
-- This is a one-time cleanup for security
UPDATE public.fiscal_calendars 
SET owner_id = (
  SELECT auth.uid() 
  FROM auth.users 
  LIMIT 1
)
WHERE owner_id IS NULL;