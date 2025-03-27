import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController';
import { authenticate, isAdmin } from '../middlewares/auth';
import { uploadImage } from '../middlewares/upload';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Admin routes
router.post('/', authenticate, isAdmin, uploadImage, createProduct);
router.put('/:id', authenticate, isAdmin, uploadImage, updateProduct);
router.delete('/:id', authenticate, isAdmin, deleteProduct);

export default router;
