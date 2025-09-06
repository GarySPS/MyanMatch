// backend/routes/report.js

const express = require('express');
const router = express.Router();

/* -------------------- PUBLIC (end-user) -------------------- */
/** POST /api/report { reported_user_id, reason, details? } */
// [!REPLACED!] - Changed path from '/report' to '/'
router.post('/', async (req, res) => {
  if (!req.auth?.user?.id) return res.status(401).json({ error: 'unauthorized' });
  const supabase = req.supabase;
  const reporterId = req.auth.user.id;
  try {
    const { reported_user_id, reason, details } = req.body || {};
    if (!reported_user_id || !reason) {
      return res.status(400).json({ error: 'reported_user_id and reason are required' });
    }

    const insertRow = {
      reporter_id: reporterId,
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

/* NOTE: The admin routes below do not belong in this file. 
  They should be in your 'admin.js' file to work correctly with your app's routing.
  I am removing them from here to prevent future bugs.
*/

module.exports = router;