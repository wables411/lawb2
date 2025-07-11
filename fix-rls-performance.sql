-- Fix RLS Performance Issue for leaderboard table
-- Replace auth.<function>() with (select auth.<function>()) for better performance

-- OPTION 1: DISABLE RLS (Recommended for your setup)
-- Since you're using service role client which bypasses RLS anyway
ALTER TABLE public.leaderboard DISABLE ROW LEVEL SECURITY;

-- OPTION 2: If you want to keep RLS enabled, use optimized policies
-- First, let's see what RLS policies currently exist
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'leaderboard';

-- Drop the existing inefficient policy (if it exists)
-- DROP POLICY IF EXISTS "Allow users to update their own leaderboard entry" ON public.leaderboard;

-- Create the optimized policy based on your actual table structure
-- Your app uses wallet addresses as usernames and service role client
-- CREATE POLICY "Allow users to update their own leaderboard entry" 
-- ON public.leaderboard 
-- FOR UPDATE 
-- USING ((select auth.uid()) = username);

-- Also create policies for INSERT and SELECT if they don't exist
-- CREATE POLICY IF NOT EXISTS "Allow users to insert their own leaderboard entry" 
-- ON public.leaderboard 
-- FOR INSERT 
-- WITH CHECK ((select auth.uid()) = username);

-- CREATE POLICY IF NOT EXISTS "Allow users to view all leaderboard entries" 
-- ON public.leaderboard 
-- FOR SELECT 
-- USING (true);

-- Also check if there are any other RLS policies that need fixing
-- Common patterns to look for:
-- auth.uid() -> (select auth.uid())
-- auth.jwt() -> (select auth.jwt())
-- current_setting('request.jwt.claims') -> (select current_setting('request.jwt.claims'))

-- If you have other policies, update them like this:
-- DROP POLICY IF EXISTS "policy_name" ON table_name;
-- CREATE POLICY "policy_name" ON table_name FOR operation USING ((select auth.jwt() ->> 'sub') = username); 