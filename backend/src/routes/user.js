const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { db } = require('../config/firebase');

// Get Profile
router.get('/profile', protect, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = userDoc.data();
    delete userData.password;

    res.json({
      success: true,
      data: {
        user: {
          ...userData,
          id: userDoc.id
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
