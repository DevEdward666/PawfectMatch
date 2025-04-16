"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dashboardController_1 = require("../controllers/dashboardController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
// All routes are admin-only
router.use(authMiddleware_1.authenticate);
router.use(authMiddleware_1.isAdmin);
// Get dashboard statistics
router.get('/stats', dashboardController_1.getDashboardStats);
// Get recent adoption applications
router.get('/recent-adoptions', dashboardController_1.getRecentAdoptions);
// Get recent reports
router.get('/recent-reports', dashboardController_1.getRecentReports);
// Get inventory status
router.get('/inventory', dashboardController_1.getInventoryStatus);
// Get adoption trends
router.get('/adoption-trends', dashboardController_1.getAdoptionTrends);
exports.default = router;
