// backend/routes/admin.js

const express = require('express');
const router = express.Router();

// This route handles fetching all user reports for the admin dashboard
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

module.exports = router;