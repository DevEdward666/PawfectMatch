"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const petController_1 = require("../controllers/petController");
const auth_1 = require("../middlewares/auth");
const upload_1 = require("../middlewares/upload");
const router = express_1.default.Router();
// Public routes
router.get('/', petController_1.getAllPets);
router.get('/:id', petController_1.getPetById);
// Protected routes (require authentication)
router.post('/:id/adopt', auth_1.authenticate, petController_1.applyForAdoption);
router.get('/adoption/user', auth_1.authenticate, petController_1.getUserAdoptionApplications);
// Admin routes
// Configure multer for file uploads
router.post('/addPets', auth_1.authenticate, auth_1.isAdmin, upload_1.uploadImage, petController_1.createPet);
router.put('/:id', auth_1.authenticate, auth_1.isAdmin, upload_1.uploadImage, petController_1.updatePet);
router.delete('/:id', auth_1.authenticate, auth_1.isAdmin, petController_1.deletePet);
router.get('/adoption/all', auth_1.authenticate, auth_1.isAdmin, petController_1.getAllAdoptionApplications);
router.put('/adoption/:id', auth_1.authenticate, auth_1.isAdmin, petController_1.updateAdoptionApplication);
exports.default = router;
