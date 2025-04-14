import express from 'express';
import {
  submitReport,
  getUserReports,
  getReportById,
  getAllReports,
  updateReportStatus,
  respondToReport
} from '../controllers/reportController';
import { authenticate, isAdmin } from '../middlewares/auth';
import { uploadImage } from '../middlewares/upload';

const router = express.Router();

// Protected routes (require authentication)
router.post('/all', authenticate, uploadImage, submitReport);
router.get('/user', authenticate, getUserReports);
router.get('/:id', authenticate, getReportById);

// Admin routes
router.get('/', authenticate, isAdmin, getAllReports);
router.put('/:id/status', authenticate, isAdmin, updateReportStatus);
router.post('/:id/respond', authenticate, isAdmin, respondToReport);

export default router;
