"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveFile = exports.handleFileUpload = exports.uploadSingle = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
// Set up storage for uploaded files
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        // Create uploads directory if it doesn't exist
        const uploadDir = path_1.default.join(__dirname, 'uploads');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, 'file-' + uniqueSuffix + ext);
    }
});
// Create multer upload instance
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB file size limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        const allowedFileTypes = /jpeg|jpg|png|gif/;
        const ext = allowedFileTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedFileTypes.test(file.mimetype);
        if (ext && mimetype) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});
// Upload a single file
exports.uploadSingle = upload.single('image');
// Handle file upload
const handleFileUpload = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded or file type not supported'
            });
        }
        // Create URL for the uploaded file
        const fileUrl = `/api/uploads/${req.file.filename}`;
        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                url: fileUrl
            }
        });
    }
    catch (error) {
        console.error('Error handling file upload:', error);
        res.status(500).json({
            success: false,
            message: 'Error handling file upload',
            error: error.message
        });
    }
};
exports.handleFileUpload = handleFileUpload;
// Serve uploaded files
const serveFile = (req, res) => {
    try {
        const filename = req.params.filename;
        const filepath = path_1.default.join(__dirname, 'uploads', filename);
        // Check if file exists
        if (!fs_1.default.existsSync(filepath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }
        res.sendFile(filepath);
    }
    catch (error) {
        console.error('Error serving file:', error);
        res.status(500).json({
            success: false,
            message: 'Error serving file',
            error: error.message
        });
    }
};
exports.serveFile = serveFile;
