const express = require('express');
const router = express.Router();

// Mock packages data
const packages = [
  { id: 'free', name: 'FREE', speed: '5 Mbps', price: 0, recommended: false },
  { id: 'silver', name: 'SILVER', speed: '10 Mbps', price: 500, recommended: true },
  { id: 'gold', name: 'GOLD', speed: '20 Mbps', price: 1000, recommended: false }
];

router.get('/packages', (req, res) => {
  res.json({ success: true, data: packages });
});

module.exports = router;
