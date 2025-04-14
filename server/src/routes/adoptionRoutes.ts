import express from 'express';
import {
   getAdoptionApplication,
   getAllAdoption,
   getuserAdoptionApplication,
   createNewAdoptionApplication,
   updateAdoptionApplication,
   deleteAdoptionApplication
  } from '../controllers/adoptionController';
const router = express.Router();

// Public routes
router.get('/all', getAllAdoption);
router.get('/:id', getAdoptionApplication);
router.put('/:id', updateAdoptionApplication);
router.delete('/:id', deleteAdoptionApplication);
router.post('/', createNewAdoptionApplication);
router.get('/user/:userId', getuserAdoptionApplication);


export default router;