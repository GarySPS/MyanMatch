//backend/auth

const express = require('express');
const router = express.Router();

/**
 * Optional: simple health or "whoami" endpoint once frontend attaches a Bearer token.
 * The req.auth is set by our new verify middleware (see middleware/auth.js).
 */
router.get('/me', (req, res) => {
  if (!req.auth) return res.status(401).json({ error: 'No session' });
  res.json({ user: req.auth.user });
});

module.exports = router;
