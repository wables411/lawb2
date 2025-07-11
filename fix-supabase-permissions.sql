-- Fix Supabase permissions for chess_games table
-- Run this in your Supabase SQL Editor

-- 1. First, drop all existing conflicting policies
DROP POLICY IF EXISTS "Allow public read access to chess_games" ON chess_games;
DROP POLICY IF EXISTS "Allow authenticated users to insert chess_games" ON chess_games;
DROP POLICY IF EXISTS "Allow players to update their games" ON chess_games;
DROP POLICY IF EXISTS "Allow authenticated users to read chess games" ON chess_games;
DROP POLICY IF EXISTS "Allow game participants to update chess games" ON chess_games;
DROP POLICY IF EXISTS "Allow authenticated users to insert chess games" ON chess_games;
DROP POLICY IF EXISTS "Allow game participants to delete chess games" ON chess_games;

-- 2. Create simple wallet-based policies (no auth required)
CREATE POLICY "Allow all reads" ON chess_games
FOR SELECT USING (true);

CREATE POLICY "Allow all updates" ON chess_games
FOR UPDATE USING (true);

CREATE POLICY "Allow all inserts" ON chess_games
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all deletes" ON chess_games
FOR DELETE USING (true);

-- 3. Grant necessary permissions
GRANT ALL ON chess_games TO anon;
GRANT ALL ON chess_games TO authenticated;

-- 4. Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'chess_games'; 