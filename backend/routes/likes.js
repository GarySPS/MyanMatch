// routes/likes.js
const express = require('express');
const router = express.Router();

// POST /api/likes
router.post('/', async (req, res) => {
  const { from_user_id, to_user_id, comment, type } = req.body;
  if (!from_user_id || !to_user_id) {
    return res.status(400).json({ error: "Missing from_user_id or to_user_id" });
  }

  // Insert like into Supabase
  const { data, error } = await req.supabase
    .from('likes')
    .insert([{
      from_user_id,
      to_user_id,
      type: type || "like",
      comment: comment || null,
      is_visible: true,
      created_at: new Date().toISOString()
    }]);
  if (error) {
    console.error("Supabase Like Insert Error:", error);
    return res.status(500).json({ error: "Failed to save like" });
  }
  res.json({ success: true, data });
});

module.exports = router;
