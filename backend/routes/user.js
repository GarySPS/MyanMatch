const express = require('express');
const router = express.Router();

/**
 * Gets a single user's main ID by their public short_id.
 */
router.get('/by-short-id/:short_id', async (req, res) => {
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

// [!REPLACED!] This endpoint now creates a reliable job in the database.
router.post('/schedule-welcome-likes', async (req, res) => {
  const newUserId = req.auth?.user?.id;

  if (!newUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log(`Queueing welcome likes for new user: ${newUserId}`);
  
  // Instead of setTimeout, insert a row into our new table.
  // The 'send_at' field defaults to 1 hour in the future automatically.
  const { error } = await req.supabase
    .from('pending_welcome_likes')
    .insert({ user_id: newUserId });

  if (error) {
    console.error("Failed to queue welcome likes:", error);
    // We don't send an error to the client, as this is a background task.
  }

  res.status(202).json({ success: true, message: "Welcome likes queued." });
});


// New secure endpoint for account deletion
router.post('/delete', async (req, res) => {
  // The `verifySupabaseToken` middleware should have already run and attached req.auth
  if (!req.auth || !req.auth.user || !req.auth.user.id) {
    return res.status(401).json({ error: 'Unauthorized: No valid session token provided.' });
  }

  const userIdToDelete = req.auth.user.id;
  const supabase = req.supabase;

  try {
    // Use the Supabase admin client to delete the user from the auth schema.
    // This will cascade and delete the user from the `profiles` table due to your foreign key constraint.
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userIdToDelete);

    if (deleteError) {
      throw deleteError;
    }

    res.status(200).json({ success: true, message: 'Account deleted successfully.' });

  } catch (e) {
    console.error(`Failed to delete user ${userIdToDelete}:`, e);
    return res.status(500).json({ error: e.message || 'An internal error occurred during account deletion.' });
  }
});


module.exports = router;