const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// GET /api/users/profile
// ============================================================
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, username, email, avatar_url, bio, created_at, last_login FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get stats
    const statsResult = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM saved_videos WHERE user_id = $1) AS saved_count,
        (SELECT COUNT(*) FROM watch_history WHERE user_id = $1) AS watched_count,
        (SELECT COUNT(*) FROM discovery_sessions WHERE user_id = $1) AS discovery_count`,
      [req.user.id]
    );

    const user = result.rows[0];
    const stats = statsResult.rows[0];

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      },
      stats: {
        savedCount: parseInt(stats.saved_count),
        watchedCount: parseInt(stats.watched_count),
        discoveryCount: parseInt(stats.discovery_count),
      },
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ============================================================
// PATCH /api/users/profile
// ============================================================
router.patch(
  '/profile',
  authenticate,
  [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-zA-Z0-9_]+$/),
    body('bio').optional().trim().isLength({ max: 500 }),
    body('avatarUrl').optional().isURL(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, bio, avatarUrl } = req.body;

    try {
      const updates = [];
      const values = [];
      let idx = 1;

      if (username !== undefined) { updates.push(`username = $${idx++}`); values.push(username); }
      if (bio !== undefined) { updates.push(`bio = $${idx++}`); values.push(bio); }
      if (avatarUrl !== undefined) { updates.push(`avatar_url = $${idx++}`); values.push(avatarUrl); }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(req.user.id);
      const result = await db.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, username, email, avatar_url, bio`,
        values
      );

      res.json({ user: result.rows[0] });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Username already taken' });
      }
      console.error('Update profile error:', err);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// ============================================================
// GET /api/users/preferences
// ============================================================
router.get('/preferences', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM user_preferences WHERE user_id = $1 ORDER BY interest_level DESC',
      [req.user.id]
    );
    res.json({ preferences: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// ============================================================
// POST /api/users/preferences
// ============================================================
router.post('/preferences', authenticate, async (req, res) => {
  const { categoryName, categoryId, interestLevel } = req.body;

  if (!categoryName) return res.status(400).json({ error: 'categoryName is required' });

  try {
    const result = await db.query(
      `INSERT INTO user_preferences (user_id, category_name, category_id, interest_level)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, category_name)
       DO UPDATE SET interest_level = EXCLUDED.interest_level
       RETURNING *`,
      [req.user.id, categoryName, categoryId, interestLevel || 3]
    );

    res.status(201).json({ preference: result.rows[0] });
  } catch (err) {
    console.error('Preferences error:', err);
    res.status(500).json({ error: 'Failed to save preference' });
  }
});

// ============================================================
// DELETE /api/users/preferences/:categoryName
// ============================================================
router.delete('/preferences/:categoryName', authenticate, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM user_preferences WHERE user_id = $1 AND category_name = $2',
      [req.user.id, req.params.categoryName]
    );
    res.json({ message: 'Preference removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove preference' });
  }
});

module.exports = router;
