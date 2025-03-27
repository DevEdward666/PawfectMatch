const express = require('express');
const router = express.Router();
const uploadController = require('./uploadController');
const authMiddleware = require('./authMiddleware');

// Upload route - requires authentication
router.post('/', 
  authMiddleware.authenticate, 
  uploadController.uploadSingle, 
  uploadController.handleFileUpload
);

// Serve uploaded files
router.get('/:filename', uploadController.serveFile);

module.exports = router;