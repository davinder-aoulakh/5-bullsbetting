import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const DATACHECKER_BASE_URL = 'https://developer.staging.datachecker.nl';
const TOKEN_CACHE_KEY = 'datachecker_token';
const TOKEN_CACHE = new Map();

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await base44.auth.me(); // Verify authentication

    // Check if we have a valid cached token
    const cached = TOKEN_CACHE.get(TOKEN_CACHE_KEY);
    if (cached && cached.expiresAt > Date.now()) {
      return Response.json({ 
        accessToken: cached.token,
        expiresIn: Math.floor((cached.expiresAt - Date.now()) / 1000)
      });
    }

    // Get credentials from environment
    const clientId = Deno.env.get('DATACHECKER_CLIENT_ID');
    const clientSecret = Deno.env.get('DATACHECKER_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return Response.json({ 
        error: 'DataChecker credentials not configured' 
      }, { status: 500 });
    }

    // Request new token
    const authHeader = 'Basic ' + btoa(`${clientId}:${clientSecret}`);
    
    const response = await fetch(`${DATACHECKER_BASE_URL}/api/v2/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scopes: [
          'productapi.idverify.write',
          'productapi.faceverify.write',
          'productapi.sdk.read',
          'productapi.secureidlink.write',
          'productapi.poll.read',
          'productapi.result.read'
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ 
        error: 'Failed to authenticate with DataChecker',
        details: error
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Cache the token (expires 5 minutes before actual expiry for safety)
    const expiresIn = parseInt(data.expiresIn || '3600');
    TOKEN_CACHE.set(TOKEN_CACHE_KEY, {
      token: data.accessToken,
      expiresAt: Date.now() + (expiresIn - 300) * 1000
    });

    return Response.json({
      accessToken: data.accessToken,
      expiresIn: expiresIn
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});