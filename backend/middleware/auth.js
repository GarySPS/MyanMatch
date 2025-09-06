//backend/middleware/auth.js

async function verifySupabaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      req.auth = null;
      return next(); // No token provided, continue to the next middleware
    }

    // Use Supabase's built-in function to verify the token and get user data
    const { data: { user }, error } = await req.supabase.auth.getUser(token);

    if (error) {
      // This will catch invalid signature, expired token, etc.
      console.error('Supabase token verification error:', error.message);
      return res.status(401).json({ error: 'Unauthorized: ' + error.message });
    }

    req.auth = { user };
    next();

  } catch (e) {
    console.error('Critical error in auth middleware:', e);
    req.auth = null;
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


/**
 * Middleware to ensure the verified user is an admin.
 * Must run AFTER verifySupabaseToken.
 */
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