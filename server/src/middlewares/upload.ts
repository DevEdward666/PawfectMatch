import multer from 'multer';

// Use memory storage so files are available as buffers for base64 conversion and database storage
const storage = multer.memoryStorage();

// Filter for allowed file types
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.'));
  }
};

// Set up multer with configured storage
export const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Middleware for single image upload (field name 'image')
export const uploadImage = upload.single('image');

// The uploaded file will be available as req.file with:
// - req.file.buffer: Buffer containing the file data (convert to base64 in your controller)
// - req.file.originalname: Original filename
// - req.file.mimetype: MIME type of the file
