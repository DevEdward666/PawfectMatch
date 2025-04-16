"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adoptionController_1 = require("../controllers/adoptionController");
const router = express_1.default.Router();
// Public routes
router.get('/all', adoptionController_1.getAllAdoption);
router.get('/:id', adoptionController_1.getAdoptionApplication);
router.put('/:id', adoptionController_1.updateAdoptionApplication);
router.delete('/:id', adoptionController_1.deleteAdoptionApplication);
router.post('/', adoptionController_1.createNewAdoptionApplication);
router.get('/user/:userId', adoptionController_1.getuserAdoptionApplication);
exports.default = router;
