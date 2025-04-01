// import express, { Request, Response, NextFunction } from 'express';
// import { db } from './db';
// import { pets } from '../shared/schema';
// import { eq } from 'drizzle-orm';

// const router = express.Router();

// // GET all pets
// router.get('/', async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const allPets = await db.select().from(pets);
//     res.status(200).json(allPets);
//   } catch (error) {
//     console.error('Error fetching pets:', error);
//     res.status(500).json({ error: 'Failed to fetch pets' });
//   }
// });

// // GET pet by ID
// router.get('/:id', async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const [pet] = await db.select().from(pets).where(eq(pets.id, Number(id)));
    
//     if (!pet) {
//       return res.status(404).json({ error: 'Pet not found' });
//     }
    
//     return res.status(200).json(pet);
//   } catch (error) {
//     console.error('Error fetching pet:', error);
//     return res.status(500).json({ error: 'Failed to fetch pet' });
//   }
// });

// // Basic authentication middleware (placeholder)
// const authenticate = (req: Request, res: Response, next: NextFunction) => {
//   // For simplicity, we'll just pass through for now
//   // In a real implementation, this would validate JWT tokens
//   next();
// };

// // Basic admin check middleware (placeholder)
// const isAdmin = (req: Request, res: Response, next: NextFunction) => {
//   // For simplicity, we'll just pass through for now
//   // In a real implementation, this would check user roles
//   next();
// };

// export default router;


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
} from './src/controllers/petController';
import { authenticate, isAdmin } from './src/middlewares/auth';
import { uploadImage } from './src/middlewares/upload';

const router = express.Router();

// Public routes
router.get('/', getAllPets);
router.get('/:id', getPetById);

// Protected routes (require authentication)
router.post('/:id/adopt', authenticate, applyForAdoption);
router.get('/adoption/user', authenticate, getUserAdoptionApplications);

// Admin routes
// Configure multer for file uploads

router.post('/addPets', authenticate, isAdmin, uploadImage, createPet);
router.put('/:id', authenticate, isAdmin, uploadImage, updatePet);
router.delete('/:id', authenticate, isAdmin, deletePet);
router.get('/adoption/all', authenticate, isAdmin, getAllAdoptionApplications);
router.put('/adoption/:id', authenticate, isAdmin, updateAdoptionApplication);

export default router;
