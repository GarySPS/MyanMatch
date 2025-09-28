// backend/routes/admin.js

const express = require('express');
const router = express.Router();

// [!FIXED!] This route now uses the correct Supabase admin function to get all users.
router.get('/users', async (req, res) => {
  const supabase = req.supabase;
  try {
    // Use the dedicated admin function to list all users securely
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) throw error;

    // The listUsers function returns an object with a 'users' property.
    // We map the results to create the fields your frontend expects.
    const users = data.users.map(u => ({
      id: u.id,
      username: u.user_metadata?.username || null,
      email: u.email,
      short_id: u.user_metadata?.short_id || null,
      is_admin: u.role === 'service_role' || u.user_metadata?.is_admin === true,
      created_at: u.created_at,
    }));

    res.json({ users: users || [] });
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