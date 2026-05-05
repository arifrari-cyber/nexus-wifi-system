const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { db } = require('../config/firebase');

// Initiate Payment
router.post('/cck-te', protect, async (req, res) => {
  const { packageType, method } = req.body;
  
  // Mock payment generation
  const tranId = 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const paymentNumber = method === 'BKASH' ? '01700000000' : '01800000000';

  res.json({
    success: true,
    data: {
      tranId,
      paymentNumber,
      packageType,
      method
    }
  });
});

// Verify Payment
router.post('/verify', protect, async (req, res) => {
  const { tranId, trxId, method } = req.body;

  try {
    // In a real app, you'd verify with the payment provider here.
    // We'll just update the user's status to PAID.
    
    const userRef = db.collection('users').doc(req.user.id);
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1);

    await userRef.update({
      accountSection: 'PAID',
      pppoe_username: `user_${req.user.id.slice(0, 5)}`,
      pppoe_password: Math.random().toString(36).substr(2, 8),
      expirationDate: expirationDate.toISOString()
    });

    res.json({
      success: true,
      message: 'Payment verified successfully. Your account is now PAID.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
