"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
// Public routes
router.post('/register', userController_1.registerUser);
router.post('/login', userController_1.loginUser);
// Protected routes (require authentication)
router.get('/profile', auth_1.authenticate, userController_1.getUserProfile);
router.put('/profile', auth_1.authenticate, userController_1.updateUserProfile);
router.put('/change-password', auth_1.authenticate, userController_1.changePassword);
// Admin routes
router.get('/getAllUsers', auth_1.authenticate, auth_1.isAdmin, userController_1.getAllUsers);
router.get('/getUser/:id', auth_1.authenticate, auth_1.isAdmin, userController_1.getUserById);
router.post('/create', auth_1.authenticate, auth_1.isAdmin, userController_1.createUser);
router.put('/update/:id', auth_1.authenticate, auth_1.isAdmin, userController_1.updateUser);
router.put('/:id/reset-password', auth_1.authenticate, auth_1.isAdmin, userController_1.resetUserPassword);
router.delete('/delete/:id', auth_1.authenticate, auth_1.isAdmin, userController_1.deleteUser);
exports.default = router;
