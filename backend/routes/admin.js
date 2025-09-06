const express = require('express');
const router = express.Router();

router.get('/users', async (req, res) => {
  const supabase = req.supabase;
  try {
    const { data, error } = await supabase
      .from('app_users')
      // ✅ THE FIX IS HERE: Changed 'id' to 'user_id' to match the database view
      .select('user_id, short_id, email, is_admin, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Rename 'user_id' back to 'id' so the frontend doesn't break
    const users = (data || []).map(u => ({...u, id: u.user_id}));

    res.json({ users });
  } catch (e) {
    console.error('Admin user list error:', e);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/reports
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

// POST /api/admin/impersonate
router.post('/impersonate', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  const supabase = req.supabase;
  try {
    // First, get the user's email from their ID
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(user_id);
    if (userError || !user) {
      throw userError || new Error('User not found');
    }

    // Now generate the magic link
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: {
        // Redirect to the frontend homepage after they click the link
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