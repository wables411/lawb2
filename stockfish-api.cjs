// This file is intended to be run with Node.js (CommonJS). 'require', 'process', and 'console' are available in this environment.
const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

// Health check endpoint
app.get('/api/stockfish', (req, res) => {
  res.json({ status: 'Stockfish API is running' });
});

app.post('/api/stockfish', (req, res) => {
  const { fen, movetime } = req.body;
  console.log(`Received request for FEN: ${fen}, movetime: ${movetime}`);
  
  const stockfish = spawn('stockfish');
  let bestmove = null;
  let timeout = null;
  let responseSent = false;

  // Set a timeout to prevent hanging (increased to 15 seconds)
  timeout = setTimeout(() => {
    if (!responseSent) {
      console.log('Request timed out, killing Stockfish process');
      stockfish.kill();
      responseSent = true;
      res.status(500).json({ error: 'Request timed out' });
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
      res.json({ bestmove });
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
      res.status(500).json({ error: 'Failed to start Stockfish' });
    }
  });

  stockfish.on('close', (code) => {
    console.log(`Stockfish process exited with code ${code}`);
    if (!bestmove && !responseSent) {
      clearTimeout(timeout);
      responseSent = true;
      res.status(500).json({ error: 'Stockfish process closed without providing a move' });
    }
  });

  // Send commands to Stockfish
  stockfish.stdin.write('uci\n');
  stockfish.stdin.write('isready\n');
  stockfish.stdin.write(`position fen ${fen}\n`);
  stockfish.stdin.write(`go movetime ${movetime || 1000}\n`);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Stockfish API running on port ${PORT}`)); 