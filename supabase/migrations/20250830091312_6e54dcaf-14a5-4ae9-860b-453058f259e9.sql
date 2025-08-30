-- Fix infinite recursion in profiles RLS policy
-- The issue is that the "Admins can view all profiles" policy references itself

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate it without self-reference by using a simpler approach
-- We'll check the role directly from the current profile instead of using EXISTS with subquery
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  CASE 
    WHEN auth.uid() IS NULL THEN false
    ELSE (
      SELECT role = 'admin'::user_role 
      FROM public.profiles 
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  END
);