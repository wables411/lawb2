// Netlify serverless function to proxy Alchemy NFT API calls
// This keeps the API key server-side and prevents it from being exposed in client code

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get API key from environment variable (server-side only)
  const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
  
  if (!ALCHEMY_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Alchemy API key not configured' })
    };
  }

  // Get query parameters
  const { owner, contractAddress } = event.queryStringParameters || {};
  
  if (!owner || !contractAddress) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required parameters: owner, contractAddress' })
    };
  }

  try {
    // Call Alchemy NFT API
    const alchemyUrl = `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getNFTs?owner=${encodeURIComponent(owner)}&contractAddresses[]=${encodeURIComponent(contractAddress)}&withMetadata=false&pageSize=100`;
    
    const response = await fetch(alchemyUrl);
    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Alchemy API error', details: data })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Allow CORS from your domain
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};

