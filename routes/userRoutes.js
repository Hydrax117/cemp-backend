import { Router } from "express";
import { authorizeRoles, isAuthenticatedUser } from "../middlewares/auth.js";
import {
  signUp,
  login,
  getAllUsers,
  getUser,
  forgotPassword,
  resetPassword,
  updateUser,
  deleteUser,
  logout,
  updatePassword,
  updateUserRole,
  searchUser,
  registeredEvents,
  googleLogin,
  googleLoginResponse,
} from "../controllers/userController.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import User from "../models/userModel.js";
import { catchAsync } from "../utils/catchAsync.js";

//TODO - import { requireSignIn } from "../helpers/authHelpers.js";
const router = Router();

cloudinary.config({
  cloud_name: process.env.cloud_name, // Replace with your Cloudinary cloud name
  api_key: process.env.api_key, // Replace with your Cloudinary API key
  api_secret: process.env.api_secret, // Replace with your Cloudinary API secret
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    resource_type: "auto",
    allowed_formats: ["jpg", "png"],
  },
});

const upload = multer({ storage: storage });

router.post(
  "/upload-image",
  upload.single("image"),
  catchAsync(async (req, res, next) => {
    // Check for upload errors

    if (req.fileValidationError) {
      return res.status(400).json({ message: req.fileValidationError });
    } else if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    // // console.log(req.body.date);
    // var eventTitle = req.body.title;
    // var eventDescription = req.body.description;

    // if (eventTitle && eventDescription) {
    //   var findEvent = await eventModel.find({ title: eventTitle });
    //   if (findEvent.length > 0) {
    //     return res.status(500).json({ message: "event already exsist" });
    //   }
    // } else {
    //   return next(new HttpError("title,description is required "), 500);
    // }

    try {
      const result = await cloudinary.uploader.upload(req.file.path);
      const uploadImageUrl = result.secure_url;
      // console.log(result);

      try {
        var user = new User.findOne({ _id: req.user._id });

        user.avatar = uploadImageUrl;

        await user.save();
        return res.json({
          success: true,
          data: uploadImageUrl,
        });
      } catch (error) {
        return next(new HttpError(error.message), 500);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error uploading image" });
    }
  })
);

router.get("/isAuthenticated", isAuthenticatedUser, (req, res) => {
  return res.status(200).json({ message: "success" });
});
router.post("/signup", upload.single("avatar"), signUp);
router.post("/login", login);
router.get("/users", isAuthenticatedUser, getAllUsers);
router.get("/user/:id", getUser);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.put("/me/update", isAuthenticatedUser, upload.single("avatar"), updateUser);
router.put("/me/update-password", isAuthenticatedUser, updatePassword);
router
  .route("/delete/:id")
  .delete(isAuthenticatedUser, authorizeRoles("community-admin"), deleteUser);
router
  .route("/assign-role/:id")
  .put(isAuthenticatedUser, authorizeRoles("community-admin"), updateUserRole);
router.get("/logout", logout);
router.get("/me/search", searchUser);
router.get("/events", isAuthenticatedUser, registeredEvents);
router.get("/auth/google", googleLogin);
router.get("/auth/google/callback", googleLoginResponse);

export default router;
