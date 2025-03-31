import express from 'express';
import {
  getAllPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
  applyForAdoption,
  getUserAdoptionApplications,
  getAllAdoptionApplications,
  updateAdoptionApplication
} from '../controllers/petController';
import { authenticate, isAdmin } from '../middlewares/auth';
import { uploadImage } from '../middlewares/upload';

const router = express.Router();

// Public routes
router.get('/', getAllPets);
router.get('/:id', getPetById);

// Protected routes (require authentication)
router.post('/:id/adopt', authenticate, applyForAdoption);
router.get('/applications/user', authenticate, getUserAdoptionApplications);

// Admin routes
// Configure multer for file uploads

router.post('/addPets', authenticate, isAdmin, uploadImage, createPet);
router.put('/:id', authenticate, isAdmin, uploadImage, updatePet);
router.delete('/:id', authenticate, isAdmin, deletePet);
router.get('/applications/all', authenticate, isAdmin, getAllAdoptionApplications);
router.put('/applications/:id', authenticate, isAdmin, updateAdoptionApplication);

export default router;
