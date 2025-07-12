exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Game monitor function is working!',
        timestamp: new Date().toISOString(),
        note: 'This is a simplified version without external dependencies'
      })
    };

  } catch (error) {
    console.error('Error in game monitor:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}; 