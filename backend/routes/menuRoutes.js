const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { getAllMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } = require('../controllers/menuController');

router.get('/', authMiddleware, getAllMenuItems);
router.post('/', authMiddleware, adminMiddleware, createMenuItem);
router.put('/:id', authMiddleware, adminMiddleware, updateMenuItem);
router.delete('/:id', authMiddleware, adminMiddleware, deleteMenuItem);

module.exports = router;
