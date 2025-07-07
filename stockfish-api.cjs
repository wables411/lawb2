// This file is intended to be run with Node.js (CommonJS). 'require', 'process', and 'console' are available in this environment.
const http = require('http');
const { spawn } = require('child_process');
const url = require('url');

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
      
      const stockfish = spawn('stockfish');
      let bestmove = null;
      let timeout = null;
      let responseSent = false;

      // Set a timeout to prevent hanging
      timeout = setTimeout(() => {
        if (!responseSent) {
          console.log('Request timed out, killing Stockfish process');
          stockfish.kill();
          responseSent = true;
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Request timed out' }));
        }
      }, 15000);

      stockfish.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine && !responseSent) {
            console.log(`Stockfish output: ${trimmedLine}`);
            if (trimmedLine.startsWith('bestmove')) {
              bestmove = trimmedLine.split(' ')[1];
              clearTimeout(timeout);
              stockfish.kill();
              console.log(`Best move found: ${bestmove}`);
              responseSent = true;
              
              // Return response in the format expected by the frontend
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                bestmove: bestmove,
                fen: fen,
                evaluation: 0,
                difficulty: difficulty,
                depth: 25,
                skillLevel: 20
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
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to start Stockfish' }));
        }
      });

      stockfish.on('close', (code) => {
        console.log(`Stockfish process exited with code ${code}`);
        if (!bestmove && !responseSent) {
          clearTimeout(timeout);
          responseSent = true;
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Stockfish process closed without providing a move' }));
        }
      });

      // Send commands to Stockfish
      stockfish.stdin.write('uci\n');
      stockfish.stdin.write('isready\n');
      stockfish.stdin.write(`position fen ${fen}\n`);
      stockfish.stdin.write(`go movetime ${movetime || 1000}\n`);
      
    } catch (error) {
      console.error('Server error:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Stockfish API running on port ${PORT}`);
}); 