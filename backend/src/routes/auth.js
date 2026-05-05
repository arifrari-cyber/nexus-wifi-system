const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

// Register
router.post('/register', async (req, res) => {
  const { firstName, lastName, mobile, email, password } = req.body;

  try {
    const userRef = db.collection('users');
    const emailCheck = await userRef.where('email', '==', email).get();
    if (!emailCheck.empty) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      mobile,
      email,
      password: hashedPassword,
      accountSection: 'FREE',
      pppoe_username: '',
      pppoe_password: '',
      expirationDate: null,
      role: 'user',
      createdAt: new Date()
    };

    const doc = await userRef.add(newUser);

    res.status(201).json({ success: true, message: 'User registered successfully', userId: doc.id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const userRef = db.collection('users');
    let userQuery = await userRef.where('email', '==', identifier).get();
    
    if (userQuery.empty) {
      userQuery = await userRef.where('mobile', '==', identifier).get();
    }

    if (userQuery.empty) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: userDoc.id, email: userData.email, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      token,
      user: {
        id: userDoc.id,
        fullName: userData.fullName,
        email: userData.email,
        role: userData.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
