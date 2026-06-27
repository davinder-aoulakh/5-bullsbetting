const DATACHECKER_BASE_URL = Deno.env.get('DATACHECKER_BASE_URL') ?? 'https://developer.staging.datachecker.nl';

// Per-scope-set token cache
const tokenCache = new Map();

/**
 * Get OAuth token from DataChecker with per-scope-set caching
 * @param {string[]} scopes - Array of required scopes
 * @returns {Promise<string>} Access token
 * @throws Error if authentication fails
 */
export async function getOAuthToken(scopes) {
  const now = Date.now();
  
  // Create stable cache key from sorted scopes
  const cacheKey = [...scopes].sort().join(',');
  
  // Check if we have a valid cached token for this scope set
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    console.log('✅ Using cached OAuth token for scopes:', scopes.length);
    return cached.token;
  }

  // Get credentials
  const clientId = Deno.env.get('DATACHECKER_CLIENT_ID');
  const clientSecret = Deno.env.get('DATACHECKER_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('DataChecker credentials not configured');
  }

  const authHeader = 'Basic ' + btoa(`${clientId}:${clientSecret}`);
  
  console.log('🔑 Requesting new OAuth token with scopes:', scopes.length);
  
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
    console.error('❌ OAuth token request failed with status:', tokenResponse.status);
    throw new Error('Failed to authenticate with DataChecker');
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.accessToken;
  const expiresIn = tokenData.expires_in || 300; // Default to 5 minutes

  if (!accessToken) {
    throw new Error('No access token in OAuth response');
  }

  // Cache the token with safety buffer (subtract 30 seconds)
  const expiresAt = now + ((expiresIn - 30) * 1000);
  tokenCache.set(cacheKey, {
    token: accessToken,
    expiresAt
  });

  console.log('✅ New OAuth token obtained and cached');
  return accessToken;
}