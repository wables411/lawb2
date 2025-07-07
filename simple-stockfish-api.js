const http = require('http');
const { spawn } = require('child_process');
const url = require('url');

// Helper function to get difficulty settings
function getDifficultySettings(difficulty) {
  switch (difficulty) {
    case 'novice':
      return {
        skillLevel: 1,
        depth: 8,
        movetime: 1000,
        description: 'Very easy - makes many mistakes'
      };
    case 'intermediate':
      return {
        skillLevel: 5,
        depth: 12,
        movetime: 2000,
        description: 'Moderate challenge - plays reasonably'
      };
    case 'master':
      return {
        skillLevel: 15,
        depth: 18,
        movetime: 6000,
        description: 'Very strong - hard to beat'
      };
    case 'grand-master':
      return {
        skillLevel: 20,
        depth: 25,
        movetime: 12000,
        description: 'Virtually unbeatable'
      };
    default:
      return {
        skillLevel: 10,
        depth: 15,
        movetime: 3000,
        description: 'Default intermediate level'
      };
  }
}

// CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Parse JSON from request body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  
  // Health check endpoint
  if (req.method === 'GET' && parsedUrl.pathname === '/api/stockfish') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'Stockfish API is running' }));
    return;
  }
  
  // Stockfish API endpoint
  if (req.method === 'POST' && parsedUrl.pathname === '/api/stockfish') {
    try {
      const body = await parseJsonBody(req);
      const { fen, difficulty = 'intermediate', movetime } = body;
      
      console.log(`Received request for FEN: ${fen}, difficulty: ${difficulty}, movetime: ${movetime}`);
      
      if (!fen) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'FEN position required' }));
        return;
      }
      
      const settings = getDifficultySettings(difficulty);
      const actualMovetime = movetime || settings.movetime;
      
      console.log(`Using settings: skillLevel=${settings.skillLevel}, depth=${settings.depth}, movetime=${actualMovetime}`);
      
      const stockfish = spawn('stockfish');
      let bestmove = null;
      let evaluation = null;
      let depth = null;
      let timeout = null;
      let responseSent = false;

      // Set a timeout to prevent hanging
      const timeoutDuration = difficulty === 'grand-master' ? 20000 : 15000;
      timeout = setTimeout(() => {
        if (!responseSent) {
          console.log('Request timed out, killing Stockfish process');
          stockfish.kill();
          responseSent = true;
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Request timed out' }));
        }
      }, timeoutDuration);

      stockfish.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine && !responseSent) {
            console.log(`Stockfish output: ${trimmedLine}`);
            
            // Parse evaluation info
            if (trimmedLine.startsWith('info') && trimmedLine.includes('score')) {
              const scoreMatch = trimmedLine.match(/score (cp|mate) (-?\d+)/);
              if (scoreMatch) {
                const scoreType = scoreMatch[1];
                const scoreValue = parseInt(scoreMatch[2]);
                if (scoreType === 'cp') {
                  evaluation = scoreValue;
                } else if (scoreType === 'mate') {
                  evaluation = scoreValue > 0 ? 10000 : -10000;
                }
              }
              
              const depthMatch = trimmedLine.match(/depth (\d+)/);
              if (depthMatch) {
                depth = parseInt(depthMatch[1]);
              }
            }
            
            // Parse best move
            if (trimmedLine.startsWith('bestmove')) {
              bestmove = trimmedLine.split(' ')[1];
              clearTimeout(timeout);
              stockfish.kill();
              console.log(`Best move found: ${bestmove}, evaluation: ${evaluation}, depth: ${depth}`);
              responseSent = true;
              
              // Return response in the format expected by the frontend
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                bestmove: bestmove,
                fen: fen,
                evaluation: evaluation || 0,
                difficulty: difficulty,
                depth: depth || settings.depth,
                skillLevel: settings.skillLevel
              }));
            }
          }
        });
      });

      stockfish.stderr.on('data', (data) => {
        console.log(`Stockfish error: ${data.toString()}`);
      });

      stockfish.on('error', (error) => {
        console.log(`Failed to start Stockfish: ${error.message}`);
        if (!responseSent) {
          clearTimeout(timeout);
          responseSent = true;
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to start Stockfish' }));
        }
      });

      stockfish.on('close', (code) => {
        console.log(`Stockfish process exited with code ${code}`);
        if (!bestmove && !responseSent) {
          clearTimeout(timeout);
          responseSent = true;
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Stockfish process closed without providing a move' }));
        }
      });

      // Send commands to Stockfish with difficulty-specific settings
      stockfish.stdin.write('uci\n');
      stockfish.stdin.write('isready\n');
      stockfish.stdin.write(`setoption name Skill Level value ${settings.skillLevel}\n`);
      stockfish.stdin.write(`setoption name MultiPV value 1\n`);
      stockfish.stdin.write(`setoption name Threads value 1\n`);
      stockfish.stdin.write(`setoption name Hash value 32\n`);
      stockfish.stdin.write(`position fen ${fen}\n`);
      stockfish.stdin.write(`go movetime ${actualMovetime} depth ${settings.depth}\n`);
      
    } catch (error) {
      console.error('Server error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Stockfish API running on port ${PORT}`);
}); 