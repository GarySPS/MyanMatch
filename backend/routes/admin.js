// backend/routes/admin.js

const express = require('express');
const router = express.Router();

// [!REPLACED!] - This entire route is updated to be simpler and more correct.
router.get('/users', async (req, res) => {
  const supabase = req.supabase;
  try {
    // Now we select from our clean 'app_users' view
    const { data, error } = await supabase
      .from('detailed_users')
      .select('id, username, email, short_id, is_admin, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    res.json({ users: data || [] });
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