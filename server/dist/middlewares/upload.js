"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
// Use memory storage so files are available as buffers for base64 conversion and database storage
const storage = multer_1.default.memoryStorage();
// Filter for allowed file types
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.'));
    }
};
// Set up multer with configured storage
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});
// Middleware for single image upload (field name 'image')
exports.uploadImage = exports.upload.single('image');
// The uploaded file will be available as req.file with:
// - req.file.buffer: Buffer containing the file data (convert to base64 in your controller)
// - req.file.originalname: Original filename
// - req.file.mimetype: MIME type of the file
