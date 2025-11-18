// Netlify serverless function to proxy Alchemy NFT API calls
// This keeps the API key server-side and prevents it from being exposed in client code
// Requires ALCHEMY_API_KEY environment variable (set in Netlify, NOT VITE_ALCHEMY_API_KEY)

exports.handler = async (event, context) => {
  // Set CORS headers for all responses
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get API key from environment variable (server-side only)
  const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
  
  if (!ALCHEMY_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Alchemy API key not configured' })
    };
  }

  // Get query parameters
  const { owner, contractAddress } = event.queryStringParameters || {};
  
  if (!owner || !contractAddress) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required parameters: owner, contractAddress' })
    };
  }

  try {
    // Call Alchemy NFT API
    const alchemyUrl = `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getNFTs?owner=${encodeURIComponent(owner)}&contractAddresses[]=${encodeURIComponent(contractAddress)}&withMetadata=false&pageSize=100`;
    
    const response = await fetch(alchemyUrl);
    
    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: 'Alchemy API error', 
          status: response.status,
          details: errorText.substring(0, 500)
        })
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

