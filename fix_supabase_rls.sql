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

-- 3. DISABLE RLS for leaderboard table (since it uses wallet addresses, not Supabase auth)
ALTER TABLE public.leaderboard DISABLE ROW LEVEL SECURITY;

-- 4. Enable RLS on the games table
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for the games table
CREATE POLICY "Allow public read access to games" ON public.games
    FOR SELECT USING (true);

CREATE POLICY "Allow users to insert their own game data" ON public.games
    FOR INSERT WITH CHECK (
        auth.uid()::text = blue_player OR 
        auth.uid()::text = red_player
    );

CREATE POLICY "Allow users to update their own game data" ON public.games
    FOR UPDATE USING (
        auth.uid()::text = blue_player OR 
        auth.uid()::text = red_player
    );

CREATE POLICY "Allow users to delete their own game data" ON public.games
    FOR DELETE USING (
        auth.uid()::text = blue_player OR 
        auth.uid()::text = red_player
    );

-- 6. Enable real-time for the tables (optional - for live updates)
-- Note: This requires the realtime extension to be enabled in your Supabase project
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;
ALTER PUBLICATION supabase_realtime ADD TABLE public.games; 