// backend/routes/admin.js

const express = require('express');
const router = express.Router();

// [!FIXED!] This route now fetches from both auth.users and public.profiles and merges them.
router.get('/users', async (req, res) => {
  const supabase = req.supabase;
  try {
    // Step 1: Get the list of all users from Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000, // Adjust if you have more than 1000 users
    });
    if (authError) throw authError;

    const authUsers = authData.users;
    if (!authUsers || authUsers.length === 0) {
      return res.json({ users: [] });
    }
    const userIds = authUsers.map(u => u.id);

    // Step 2: Get the corresponding profiles for these users
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, username, short_id') // We only need these specific columns
      .in('user_id', userIds);
    if (profilesError) throw profilesError;

    // Create a map of profiles for easy and fast lookup
    const profilesMap = new Map(profilesData.map(p => [p.user_id, p]));

    // Step 3: Merge the auth data with the profile data
    const mergedUsers = authUsers.map(u => {
      const profile = profilesMap.get(u.id) || {}; // Find the matching profile
      return {
        id: u.id,
        username: profile.username || null,        // <-- Get from profiles table
        email: u.email,
        short_id: profile.short_id || null,      // <-- Get from profiles table
        is_admin: u.role === 'service_role' || u.user_metadata?.is_admin === true,
        created_at: u.created_at,
      };
    });
    
    // Sort by creation date like before
    mergedUsers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ users: mergedUsers });
  } catch (e) {
    console.error('Admin user list error:', e);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/reports (This one is fine, no changes needed)
router.get('/reports', async (req, res) => {
    const supabase = req.supabase;
    try {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ reports: data || [] });
    } catch (e) {
        console.error('Error fetching reports for admin:', e);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// POST /api/admin/impersonate (This one is fine, no changes needed)
router.post('/impersonate', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  const supabase = req.supabase;
  try {
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(user_id);
    if (userError || !user) {
      throw userError || new Error('User not found');
    }

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: {
        redirectTo: '/',
      }
    });

    if (error) throw error;
    res.json({ magic_link: data.properties.action_link });
  } catch (e) {
    console.error('Impersonation link generation failed:', e.message);
    res.status(500).json({ error: 'Could not generate login link.' });
  }
});


module.exports = router;