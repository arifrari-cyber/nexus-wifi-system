const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { db } = require('../config/firebase');

// Get All Users
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      delete data.password;
      users.push({ id: doc.id, ...data });
    });

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update User
router.put('/user/:id', protect, adminOnly, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    await db.collection('users').doc(id).update(updates);
    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
