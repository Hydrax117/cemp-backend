import { Router } from "express";
const router = Router();
import {
  createNewEvent,
  updateEvent,
  deleteEvent,
  getOneEvent,
  searchEvent,
  eventRegistration,
  getAllEvents,
  registeredUsers,
  eventUnRegister,
} from "../controllers/eventController.js";
import { isAuthenticatedUser } from "../middlewares/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { catchAsync } from "../utils/catchAsync.js";
import eventModel from "../models/eventModel.js";
import HttpError from "../utils/http-error.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Specify the directory to store uploaded images
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original filename
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

    // Extract uploaded file details
    const ext = path.extname(req.file.originalname).toLowerCase();
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const newFilePath = filePath.replace(/\\/g, "/");
    console.log("new path", newFilePath);

    // Verify file path
    if (!fs.existsSync(filePath)) {
      return res.status(500).json({ message: "Error saving uploaded image" });
    }

    // Your processing logic for the uploaded image goes here...

    try {
      var eventTitle = req.body.title;
      var eventDescription = req.body.description;
      if (eventTitle && eventDescription) {
        var findEvent = await eventModel.find({ title: eventTitle });
        if (findEvent.length > 0) {
          return next(new HttpError("event already exsist"), 500);
        }
        var event = new eventModel(req.body);
        event.imageUrl = `${process.env.BASE_URL}/${newFilePath}`;
        await event.save();
        return res.json({
          success: true,
          data: event,
        });
      } else {
        return next(new HttpError("title is required "), 500);
      }
    } catch (error) {
      return next(new HttpError(error.message), 500);
    }
    // res.json({ message: 'Image uploaded successfully!', filePath, originalName });
  })
);
router.post("/create", createNewEvent);
router.get("/search", searchEvent);
router.get("/get-one-event", getOneEvent);
router.get("/all", getAllEvents);
router.get("/:id/registered", registeredUsers);
router.put("/update/:id", updateEvent);
router.delete("/delete/:id", deleteEvent);
router.post("/:id/register", isAuthenticatedUser, eventRegistration);
router.delete("/:eventId/unregister", isAuthenticatedUser, eventUnRegister);

export default router;
