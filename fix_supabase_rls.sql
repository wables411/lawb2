-- Fix RLS issues for chess game tables
-- Run these commands in your Supabase SQL Editor

-- 1. Enable RLS on the players table
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- 2. Create proper RLS policies for the players table (using the correct column name)
CREATE POLICY "Allow public read access to players" ON public.players
    FOR SELECT USING (true);

CREATE POLICY "Allow users to insert their own player data" ON public.players
    FOR INSERT WITH CHECK (auth.uid()::text = address);

CREATE POLICY "Allow users to update their own player data" ON public.players
    FOR UPDATE USING (auth.uid()::text = address);

CREATE POLICY "Allow users to delete their own player data" ON public.players
    FOR DELETE USING (auth.uid()::text = address);

-- 3. Enable RLS on the leaderboard table
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Policy for reading leaderboard (allow public read access)
CREATE POLICY "Allow public read access to leaderboard" ON public.leaderboard
    FOR SELECT USING (true);

-- Policy for inserting leaderboard entries (allow authenticated users)
CREATE POLICY "Allow users to insert leaderboard data" ON public.leaderboard
    FOR INSERT WITH CHECK (true);

-- Policy for updating leaderboard entries (allow users to update their own data)
CREATE POLICY "Allow users to update their own leaderboard data" ON public.leaderboard
    FOR UPDATE USING (auth.uid()::text = username);

-- Policy for deleting leaderboard entries (allow users to delete their own data)
CREATE POLICY "Allow users to delete their own leaderboard data" ON public.leaderboard
    FOR DELETE USING (auth.uid()::text = username);

-- 4. Enable RLS on the chess_games table
ALTER TABLE public.chess_games ENABLE ROW LEVEL SECURITY;

-- Policy for reading chess games (allow public read access)
CREATE POLICY "Allow public read access to chess games" ON public.chess_games
    FOR SELECT USING (true);

-- Policy for inserting chess games (allow authenticated users)
CREATE POLICY "Allow users to insert chess games" ON public.chess_games
    FOR INSERT WITH CHECK (true);

-- Policy for updating chess games (allow players to update their games)
CREATE POLICY "Allow players to update their chess games" ON public.chess_games
    FOR UPDATE USING (
        auth.uid()::text = blue_player OR 
        auth.uid()::text = red_player
    );

-- Policy for deleting chess games (allow players to delete their games)
CREATE POLICY "Allow players to delete their chess games" ON public.chess_games
    FOR DELETE USING (
        auth.uid()::text = blue_player OR 
        auth.uid()::text = red_player
    );

-- 5. Enable real-time for the tables (optional - for live updates)
-- Note: This requires the realtime extension to be enabled in your Supabase project
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chess_games; 