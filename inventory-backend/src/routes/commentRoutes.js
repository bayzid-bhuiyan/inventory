const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// POST /api/comments/inventory/:inventoryId
// Only logged-in users can post comments
router.post('/inventory/:inventoryId', isAuthenticated, commentController.addComment);

// GET /api/comments/inventory/:inventoryId
// Anyone (even guests) can view comments. 
// If you want to restrict this to logged-in users only, add 'isAuthenticated' here too.
router.get('/inventory/:inventoryId', commentController.getComments);

module.exports = router;