const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const {
  registerUser,
  loginUser,
  googleLogin,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const { authLimiter } = require("../middlewares/rateLimiter");
const { AppError } = require("../middlewares/errorHandler");
const {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  updateProfileSchema,
} = require("../validators/authSchemas");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage with file type and size restrictions
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Only image files (JPEG, PNG, WebP, GIF) are allowed", 400), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter,
});

router.post("/register", authLimiter, validate(registerSchema), registerUser);
router.post("/login", authLimiter, validate(loginSchema), loginUser);
router.post("/google", authLimiter, validate(googleLoginSchema), googleLogin);
router.get("/profile", protect, getUserProfile);
router.put("/update", protect, validate(updateProfileSchema), updateUserProfile);

router.post("/upload-image", protect, upload.single("image"), (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No image file provided", 400));
  }
  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.status(200).json({ success: true, imageUrl });
});

module.exports = router;
