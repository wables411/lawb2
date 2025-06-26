const supabase = window.supabase.createClient(
    'https://roxwocgknkiqnsgiojgz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveHdvY2drbmtpcW5zZ2lvamd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NjMxMTIsImV4cCI6MjA0NjMzOTExMn0.NbLMZom-gk7XYGdV4MtXYcgR8R1s8xthrIQ0hpQfx9Y',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true
        },
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        }
    }
);

// Create table subscriptions for real-time updates
const subscribeToTable = (tableName, callback) => {
    return supabase
        .channel(`${tableName}_changes`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: tableName
            },
            callback
        )
        .subscribe();
};

// Export for global use
window.gameDatabase = supabase;
window.subscribeToTable = subscribeToTable;