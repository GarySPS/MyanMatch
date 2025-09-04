// backend/routes/user.js

const express = require('express');
const router = express.Router();

/**
 * [ADMIN] Gets a list of all users for the admin dashboard.
 */
router.get('/admin/list', async (req, res) => {
  // ... your existing admin code here ...
  const supabase = req.supabase;
  const { data, error } = await supabase
    .from('app_users')
    .select('id, short_id, email, is_admin, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Admin user list error:', error);
    return res.status(500).json({ error: error.message });
  }
  res.json({ users: data });
});

/**
 * Gets a single user's main ID by their public short_id.
 */
router.get('/by-short-id/:short_id', async (req, res) => {
  // ... your existing short_id search code here ...
    const { short_id } = req.params;
    if (!short_id) {
        return res.status(400).json({ error: 'A short_id is required.' });
    }
    const supabase = req.supabase;
    const { data, error } = await supabase
        .from('app_users')
        .select('id')
        .eq('short_id', short_id)
        .maybeSingle();
    if (error) {
        console.error('Search by short_id error:', error);
        return res.status(500).json({ error: 'Database error while searching.' });
    }
    if (!data) {
        return res.status(404).json({ error: 'User with that ID was not found.' });
    }
    res.json({ user_id: data.id });
});


// [!THE NEW CODE IS HERE!]
// This endpoint schedules the welcome likes for a new user.
router.post('/schedule-welcome-likes', async (req, res) => {
  const newUserId = req.auth?.user?.id;

  if (!newUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log(`Scheduling welcome likes for new user: ${newUserId}`);

  // Wait for 1 hour, then call the SQL function you already made
  setTimeout(async () => {
    console.log(`Sending welcome likes to user: ${newUserId}`);
    await req.supabase.rpc('create_welcome_likes_for_user', {
      new_user_id: newUserId
    });
  }, 3600 * 1000); // 1 hour = 3,600,000 milliseconds

  // Immediately tell the frontend "Okay, I've scheduled it."
  res.status(202).json({ success: true, message: "Welcome likes scheduled." });
});


module.exports = router;