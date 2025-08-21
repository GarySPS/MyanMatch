// backend/routes/report.js
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

// Simple MyanMatch auth for end‑users: checks X-User-Id exists in users table
async function requireMyanMatchAuth(req, res, next) {
  try {
    const uid = req.header('X-User-Id');
    if (!uid) return res.status(401).json({ error: 'missing_user_id' });

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', uid)
      .single();

    if (error || !data) return res.status(401).json({ error: 'invalid_user' });

    req.user = { id: uid };
    next();
  } catch (e) {
    console.error('requireMyanMatchAuth error:', e);
    res.status(401).json({ error: 'auth_error' });
  }
}

/* -------------------- PUBLIC (end-user) -------------------- */
/** POST /api/report { reported_user_id, reason, details? } */
router.post('/report', requireMyanMatchAuth, async (req, res) => {
  try {
    const { reported_user_id, reason, details } = req.body || {};
    if (!reported_user_id || !reason) {
      return res.status(400).json({ error: 'reported_user_id and reason are required' });
    }

    const insertRow = {
      reporter_id: req.user.id,
      reported_user_id,
      reason,
      details: details?.trim() || null,
      status: 'new',
    };

    const { error } = await supabase.from('reports').insert([insertRow]);
    if (error) throw error;

    res.json({ ok: true });
  } catch (e) {
    console.error('POST /api/report failed:', e);
    res.status(500).json({ error: 'failed_to_create_report' });
  }
});

/* -------------------- ADMIN (dashboard) -------------------- */
/** GET /api/admin/reports -> { reports: [...] } */
router.get('/admin/reports', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('id, reporter_id, reported_user_id, reason, details, status, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ reports: data || [] });
  } catch (e) {
    console.error('GET /api/admin/reports failed:', e);
    res.status(500).json({ error: 'failed_to_fetch_reports' });
  }
});

/** POST /api/admin/block_user { user_id } */
router.post('/admin/block_user', async (req, res) => {
  try {
    const { user_id } = req.body || {};
    if (!user_id) return res.status(400).json({ error: 'user_id_required' });

    // Upsert guarantees the row exists and sets blocked=true
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ user_id, blocked: true }, { onConflict: 'user_id' })
      .select('user_id, blocked')
      .single();

    if (error) throw error;
    res.json({ ok: true, profile: data });
  } catch (e) {
    console.error('POST /api/admin/block_user failed:', e);
    res.status(500).json({ error: 'failed_to_block', details: e?.message || String(e) });
  }
});

/** POST /api/admin/release_user { user_id } */
router.post('/admin/release_user', async (req, res) => {
  try {
    const { user_id } = req.body || {};
    if (!user_id) return res.status(400).json({ error: 'user_id_required' });

    // Upsert guarantees the row exists and sets blocked=false
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ user_id, blocked: false }, { onConflict: 'user_id' })
      .select('user_id, blocked')
      .single();

    if (error) throw error;
    res.json({ ok: true, profile: data });
  } catch (e) {
    console.error('POST /api/admin/release_user failed:', e);
    res.status(500).json({ error: 'failed_to_release', details: e?.message || String(e) });
  }
});


module.exports = router;
