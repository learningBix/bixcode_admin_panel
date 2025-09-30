const express = require('express');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes in this file require authentication and admin role
// The frontend only decides what to show; this server-side check is the real gatekeeper
router.use(auth, requireAdmin);

// Example: Admin dashboard data
// Frontend calls this to load initial dashboard content after login
router.get('/dashboard', async (req, res) => {
  try {
    res.json({
      message: 'Admin dashboard data',
      user: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
        lastLogin: req.user.lastLogin
      },
      stats: {
        users: 0,
        activeToday: 0
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load admin dashboard' });
  }
});

// Health for admin area
router.get('/health', (req, res) => {
  res.json({ status: 'OK', area: 'admin' });
});

module.exports = router;


