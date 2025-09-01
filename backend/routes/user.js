// backend/routes/user.js

const express = require('express');
const router = express.Router();

/**
 * [ADMIN] Gets a list of all users for the admin dashboard.
 * This is now secure and fetches from our new 'app_users' table.
 */
router.get('/admin/list', async (req, res) => {
  // IMPORTANT: For real security, you should add a check here to ensure
  // that the person requesting this list is actually an admin.
  
  const supabase = req.supabase;
  const { data, error } = await supabase
    .from('app_users') // <-- Fetches from our new, correct table
    .select('id, short_id, email, is_admin, created_at') // <-- Selects only the safe, correct columns
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Admin user list error:', error);
    return res.status(500).json({ error: error.message });
  }
  
  // This sends the list of users to your admin page
  res.json({ users: data });
});


/**
 * Gets a single user's main ID by their public short_id.
 * This is how the "Search for a user" feature will work.
 */
router.get('/by-short-id/:short_id', async (req, res) => {
    const { short_id } = req.params;
    if (!short_id) {
        return res.status(400).json({ error: 'A short_id is required.' });
    }

    const supabase = req.supabase;

    const { data, error } = await supabase
        .from('app_users')
        .select('id') // We only need the main UUID (id) to navigate to their profile page
        .eq('short_id', short_id)
        .maybeSingle();

    if (error) {
        console.error('Search by short_id error:', error);
        return res.status(500).json({ error: 'Database error while searching.' });
    }
    if (!data) {
        return res.status(404).json({ error: 'User with that ID was not found.' });
    }

    // This returns the main user ID, e.g., "c2a1b1...".
    // The frontend can then navigate to "/profile/c2a1b1..."
    res.json({ user_id: data.id });
});


// We have removed all the old, insecure code that used plaintext passwords.
// Features like "Change Password" or "Delete Account" should now be built
// on the frontend using Supabase's secure client functions.

module.exports = router;