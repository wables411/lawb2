// Netlify function for Stockfish API using stockfish npm package
// This provides a server-side Stockfish engine for maximum strength

// Note: For Netlify functions, we'll use the stockfish npm package
// However, since Netlify functions have limitations with WASM, 
// we'll keep this as a fallback that returns null to use the worker instead

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { fen, movetime = 5000 } = body;

    if (!fen) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'FEN position required' })
      };
    }

    // Note: Netlify functions have limitations with WASM/WebAssembly
    // The worker-based approach (using stockfish-worker.js) is more reliable
    // This function serves as a fallback but should primarily use the worker
    
    // For now, return null to indicate worker should be used
    // In the future, this could be enhanced with stockfish npm package
    // but WASM support in Netlify functions can be problematic
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        move: null,
        note: 'Use worker-based Stockfish for best results. Netlify function fallback available but worker is preferred.'
      })
    };

  } catch (error) {
    console.error('Error in stockfish function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
