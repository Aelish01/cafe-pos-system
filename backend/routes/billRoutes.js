const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { createBill, getAllBills, getTodayBills } = require('../controllers/billController');

router.post('/', authMiddleware, createBill);
router.get('/', authMiddleware, adminMiddleware, getAllBills);
router.get('/today', authMiddleware, getTodayBills);

module.exports = router;
