"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reportController_1 = require("../controllers/reportController");
const auth_1 = require("../middlewares/auth");
const upload_1 = require("../middlewares/upload");
const router = express_1.default.Router();
// Protected routes (require authentication)
router.post('/', auth_1.authenticate, upload_1.uploadImage, reportController_1.submitReport);
router.get('/user', auth_1.authenticate, reportController_1.getUserReports);
router.get('/single/:id', auth_1.authenticate, reportController_1.getReportById);
// Admin routes
router.get('/all', auth_1.authenticate, auth_1.isAdmin, reportController_1.getAllReports);
router.put('/:id/status', auth_1.authenticate, auth_1.isAdmin, reportController_1.updateReportStatus);
router.post('/:id/respond', auth_1.authenticate, auth_1.isAdmin, reportController_1.respondToReport);
exports.default = router;
