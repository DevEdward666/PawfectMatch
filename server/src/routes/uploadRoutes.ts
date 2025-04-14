import express  from 'express';
import {uploadSingle,handleFileUpload,serveFile}  from '../controllers/uploadController';
import {authenticate}  from '../middlewares/authMiddleware';

const router = express.Router();
// Upload route - requires authentication
router.post('/', 
  authenticate, 
  uploadSingle, 
  handleFileUpload
);

// Serve uploaded files
router.get('/:filename', serveFile);


export default router;