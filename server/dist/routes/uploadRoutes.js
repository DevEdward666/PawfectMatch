"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uploadController_1 = require("../controllers/uploadController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
// Upload route - requires authentication
router.post('/', authMiddleware_1.authenticate, uploadController_1.uploadSingle, uploadController_1.handleFileUpload);
// Serve uploaded files
router.get('/:filename', uploadController_1.serveFile);
exports.default = router;
