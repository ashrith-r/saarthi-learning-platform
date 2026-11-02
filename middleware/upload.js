import multer from "multer"
import { storage } from "../config/cloudinary.js";

const upload=multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter(req, file, cb) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG and WebP images are supported."));
    }
    cb(null, true);
  }
});
export default upload