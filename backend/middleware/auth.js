//backend/middleware/auth.js
const { createRemoteJWKSet, jwtVerify } = require('jose');
const { fetch } = require('undici');

const SUPABASE_URL = process.env.SUPABASE_URL; // already in your env
if (!SUPABASE_URL) {
  console.warn('WARN: SUPABASE_URL not set - JWT verification will fail.');
}
const JWKS_URL = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`
  : null;

let JWKS;
if (JWKS_URL) {
  JWKS = createRemoteJWKSet(new URL(JWKS_URL), { fetch });
}

/**
 * Verify Bearer token from Authorization header.
 * On success -> req.auth = { user: { id, email, ... }, payload }
 */
async function verifySupabaseToken(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      req.auth = null;
      return next();
    }

    if (!JWKS) {
      return res.status(500).json({ error: 'JWKS not configured' });
    }

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: 'supabase',
      audience: 'authenticated',
    });

    // Supabase puts user info inside payload
    // common fields: sub (user id), email, role
    req.auth = {
      user: {
        id: payload.sub,
        email: payload.email || null,
        role: payload.role || 'authenticated',
      },
      payload,
    };
    return next();
  } catch (e) {
    req.auth = null;
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}


async function requireAdmin(req, res, next) {
    if (!req.auth?.user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const { data, error } = await req.supabase
            .from('profiles')
            .select('is_admin')
            .eq('user_id', req.auth.user.id)
            .single();

        if (error) throw error;
        if (!data?.is_admin) {
            return res.status(403).json({ error: 'Forbidden: requires admin privileges' });
        }
        // User is an admin, proceed
        next();
    } catch (e) {
        console.error('Admin check failed:', e);
        return res.status(500).json({ error: 'Error checking admin status' });
    }
}
module.exports = { verifySupabaseToken, requireAdmin };