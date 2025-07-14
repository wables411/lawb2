const WebSocket = require('ws');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running');
});

// Create WebSocket server attached to HTTP server
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

// Store active connections by game
const gameConnections = new Map();

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join_game':
          const gameId = data.gameId;
          if (!gameConnections.has(gameId)) {
            gameConnections.set(gameId, new Set());
          }
          gameConnections.get(gameId).add(ws);
          ws.gameId = gameId;
          console.log(`Client joined game: ${gameId}`);
          break;
          
        case 'update_game':
          const { gameId: updateGameId, gameData } = data;
          
          // Update Supabase database
          const { error } = await supabase
            .from('chess_games')
            .update(gameData)
            .eq('game_id', updateGameId);
          
          if (error) {
            console.error('Database update error:', error);
            return;
          }
          
          // Broadcast to all players in the game
          const connections = gameConnections.get(updateGameId);
          if (connections) {
            connections.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'game_update',
                  gameData
                }));
              }
            });
          }
          break;
      }
    } catch (error) {
      console.error('Message processing error:', error);
    }
  });
  
  ws.on('close', () => {
    if (ws.gameId) {
      const connections = gameConnections.get(ws.gameId);
      if (connections) {
        connections.delete(ws);
        if (connections.size === 0) {
          gameConnections.delete(ws.gameId);
        }
      }
    }
    console.log('Client disconnected');
  });
});

// Keep track of database changes and broadcast to WebSocket clients
async function watchDatabaseChanges() {
  const channel = supabase
    .channel('chess_games_changes')
    .on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'chess_games'
    }, (payload) => {
      const gameId = payload.new.game_id;
      const connections = gameConnections.get(gameId);
      
      if (connections) {
        connections.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'game_update',
              gameData: payload.new
            }));
          }
        });
      }
    })
    .subscribe();
}

// Start watching database changes
watchDatabaseChanges(); 