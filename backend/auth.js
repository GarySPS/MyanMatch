//backend/auth

const express = require('express');
const router = express.Router();

router.get('/me', (req, res) => {
  if (!req.auth) return res.status(401).json({ error: 'No session' });
  res.json({ user: req.auth.user });
});

module.exports = router;
