const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { getAllUsers, createUser, updateUser, resetPassword, toggleUserStatus } = require('../controllers/userController');

router.get('/', authMiddleware, adminMiddleware, getAllUsers);
router.post('/', authMiddleware, adminMiddleware, createUser);
router.put('/:id', authMiddleware, adminMiddleware, updateUser);
router.put('/:id/reset-password', authMiddleware, adminMiddleware, resetPassword);
router.put('/:id/toggle-status', authMiddleware, adminMiddleware, toggleUserStatus);

module.exports = router;
