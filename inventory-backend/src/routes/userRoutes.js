const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');
router.get('/', isAuthenticated, isAdmin, userController.getAllUsers);
router.patch('/:id/status', isAuthenticated, isAdmin, userController.updateUserStatus);
router.delete('/:id', isAuthenticated, isAdmin, userController.deleteUser);
module.exports = router;