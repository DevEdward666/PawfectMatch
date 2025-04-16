"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productController_1 = require("../controllers/productController");
const auth_1 = require("../middlewares/auth");
const upload_1 = require("../middlewares/upload");
const router = express_1.default.Router();
// Public routes
router.get('/', productController_1.getAllProducts);
router.get('/:id', productController_1.getProductById);
// Admin routes
router.post('/', auth_1.authenticate, auth_1.isAdmin, upload_1.uploadImage, productController_1.createProduct);
router.put('/:id', auth_1.authenticate, auth_1.isAdmin, upload_1.uploadImage, productController_1.updateProduct);
router.delete('/:id', auth_1.authenticate, auth_1.isAdmin, productController_1.deleteProduct);
exports.default = router;
