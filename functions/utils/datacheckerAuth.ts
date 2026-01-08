const DATACHECKER_BASE_URL = 'https://developer.staging.datachecker.nl';

// Simple in-memory cache for access tokens
let tokenCache = {
  token: null,
  scopes: [],
  expiresAt: 0
};

/**
 * Get OAuth token from DataChecker with caching
 * @param {string[]} scopes - Array of required scopes
 * @returns {Promise<string>} Access token
 * @throws Error if authentication fails
 */
export async function getOAuthToken(scopes) {
  const now = Date.now();
  
  // Check if we have a valid cached token with matching scopes
  if (tokenCache.token && tokenCache.expiresAt > now) {
    const hasAllScopes = scopes.every(scope => tokenCache.scopes.includes(scope));
    if (hasAllScopes) {
      console.log('✅ Using cached OAuth token');
      return tokenCache.token;
    }
  }

  // Get credentials
  const clientId = Deno.env.get('DATACHECKER_CLIENT_ID');
  const clientSecret = Deno.env.get('DATACHECKER_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('DataChecker credentials not configured');
  }

  const authHeader = 'Basic ' + btoa(`${clientId}:${clientSecret}`);
  
  console.log('🔑 Requesting new OAuth token with scopes:', scopes);
  
  const tokenResponse = await fetch(`${DATACHECKER_BASE_URL}/api/v2/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ scopes })
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error('❌ OAuth token error:', error);
    throw new Error('Failed to authenticate with DataChecker');
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.accessToken;

  if (!accessToken) {
    throw new Error('No access token in OAuth response');
  }

  // Cache the token (expires in 5 minutes)
  tokenCache = {
    token: accessToken,
    scopes: scopes,
    expiresAt: now + (5 * 60 * 1000)
  };

  console.log('✅ New OAuth token obtained and cached');
  return accessToken;
}