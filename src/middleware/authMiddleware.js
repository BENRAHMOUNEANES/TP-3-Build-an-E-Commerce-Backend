/**
 * Hybrid Authentication Middleware (Local JWT + OAuth 2.0 / OpenID Connect)
 * Module: ENSTA WAMD - TD-TP 3 (DzTech Store)
 * 
 * Verifies the incoming Bearer token from the `Authorization` header.
 * Seamlessly accepts either:
 * 1. Local JWT issued by POST /api/auth/login (signed with JWT_SECRET)
 * 2. External OAuth 2.0 / OIDC Token (e.g., Google or Auth0) verified using
 *    JWKS public keys and google-auth-library / jose.
 * 
 * Attaches authenticated user payload to `req.user`.
 * Returns HTTP 401 if token is missing, invalid, expired, or untrusted.
 */

const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { jwtVerify, createRemoteJWKSet } = require('jose');

// Cache remote JWKS instances to avoid fetching on every request
let remoteJWKS = null;
let googleOAuthClient = null;

const getGoogleOAuthClient = () => {
  if (!googleOAuthClient) {
    const clientId = process.env.OAUTH_CLIENT_ID || process.env.OAUTH_AUDIENCE;
    googleOAuthClient = new OAuth2Client(clientId);
  }
  return googleOAuthClient;
};

const getRemoteJWKS = () => {
  if (!remoteJWKS) {
    const jwksUri = process.env.OAUTH_JWKS_URI || 'https://www.googleapis.com/oauth2/v3/certs';
    remoteJWKS = createRemoteJWKSet(new URL(jwksUri));
  }
  return remoteJWKS;
};

/**
 * Verify external OAuth2 token (Google ID token or OIDC provider token)
 * @param {string} token
 * @returns {Promise<object|null>}
 */
const verifyOAuthToken = async (token) => {
  const audience = process.env.OAUTH_CLIENT_ID || process.env.OAUTH_AUDIENCE;
  const issuer = process.env.OAUTH_ISSUER || 'https://accounts.google.com';

  // Strategy A: Try Google Auth Library (official verifyIdToken for Google OAuth 2.0)
  try {
    const client = getGoogleOAuthClient();
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: audience
    });
    const payload = ticket.getPayload();
    if (payload) {
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        authType: 'oauth2_google'
      };
    }
  } catch (err) {
    // Strategy A did not match; fallback to generic OIDC JWKS verification
  }

  // Strategy B: Verify against provider JWKS via `jose`
  try {
    const JWKS = getRemoteJWKS();
    const verificationOptions = {};
    if (issuer) {
      // Support both accounts.google.com and https://accounts.google.com
      verificationOptions.issuer = [issuer, 'https://accounts.google.com', 'accounts.google.com'];
    }
    if (audience) {
      verificationOptions.audience = audience;
    }

    const { payload } = await jwtVerify(token, JWKS, verificationOptions);
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
      authType: 'oauth2_oidc'
    };
  } catch (err) {
    // Both OAuth strategies failed
    return null;
  }
};

/**
 * Express Authentication Middleware
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Check for presence of Authorization Bearer header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      status: 401,
      message: 'Access denied. No authorization token provided.'
    });
  }

  const token = authHeader.split(' ')[1]?.trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      status: 401,
      message: 'Access denied. Bearer token is empty.'
    });
  }

  // 2. Attempt Local JWT Verification
  const jwtSecret = process.env.JWT_SECRET || 'dztech_super_secret_jwt_key_2026_wamd_ensta';
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      authType: 'local_jwt'
    };
    return next();
  } catch (localJwtErr) {
    // If local JWT fails, continue to check if this is an external OAuth 2.0 / OIDC token
  }

  // 3. Attempt External OAuth 2.0 / OIDC Verification
  try {
    const oauthUser = await verifyOAuthToken(token);
    if (oauthUser) {
      req.user = oauthUser;
      return next();
    }
  } catch (oauthErr) {
    // Fall through to 401 response
  }

  // 4. Token is neither a valid local JWT nor a valid OAuth 2.0 token
  return res.status(401).json({
    success: false,
    status: 401,
    message: 'Invalid, expired, or untrusted authorization token.'
  });
};

module.exports = {
  authMiddleware,
  verifyOAuthToken
};
