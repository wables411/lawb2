-- Fix RLS Performance Issues for Real-time
-- Run this in your Supabase SQL Editor

-- 1. Drop existing RLS policies that are causing performance issues
DROP POLICY IF EXISTS "Enable read access for all users" ON chess_games;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON chess_games;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON chess_games;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON chess_games;

-- 2. Create optimized RLS policies
CREATE POLICY "chess_games_select_policy" ON chess_games
    FOR SELECT USING (true);

CREATE POLICY "chess_games_insert_policy" ON chess_games
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "chess_games_update_policy" ON chess_games
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "chess_games_delete_policy" ON chess_games
    FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chess_games_game_id ON chess_games(game_id);
CREATE INDEX IF NOT EXISTS idx_chess_games_game_state ON chess_games(game_state);
CREATE INDEX IF NOT EXISTS idx_chess_games_players ON chess_games(blue_player, red_player);
CREATE INDEX IF NOT EXISTS idx_chess_games_updated_at ON chess_games(updated_at);

-- 4. Optimize table for real-time
ALTER TABLE chess_games SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

-- 5. Enable real-time for the table
ALTER PUBLICATION supabase_realtime ADD TABLE chess_games;

-- 6. Create a function to optimize real-time updates
CREATE OR REPLACE FUNCTION optimize_realtime_updates()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger real-time for actual game state changes
    IF OLD.board IS DISTINCT FROM NEW.board OR 
       OLD.current_player IS DISTINCT FROM NEW.current_player OR
       OLD.game_state IS DISTINCT FROM NEW.game_state THEN
        RETURN NEW;
    END IF;
    
    -- Skip real-time for metadata updates
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for optimized real-time
DROP TRIGGER IF EXISTS chess_games_realtime_trigger ON chess_games;
CREATE TRIGGER chess_games_realtime_trigger
    AFTER UPDATE ON chess_games
    FOR EACH ROW
    EXECUTE FUNCTION optimize_realtime_updates();

-- 8. Analyze table for better query planning
ANALYZE chess_games; 