// Importing required modules
import express from "express";
import { connectToDB } from "./config/database.js";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import dotenv from "dotenv";
import cloudinary from "cloudinary";
import cookieParser from "cookie-parser";

import cron from "node-cron";
import eventModel from "./models/eventModel.js";
import moment from "moment";
import eventRoutes from "./routes/eventRoutes.js";
import multer from "multer";
import fs from "fs";
import path, { dirname } from "path";
dotenv.config();
connectToDB();
// Create an Express application
const app = express();

//Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

cloudinary.config({
  cloud_name: process.env.cloud_name, // Replace with your Cloudinary cloud name
  api_key: process.env.api_key, // Replace with your Cloudinary API key
  api_secret: process.env.api_secret, // Replace with your Cloudinary API secret
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "." + file.originalname);
  },
});

const upload = multer({ storage: storage });

//API routes
app.use("/api/users", userRoutes);
app.use("/api/event", eventRoutes);

// Define routes
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Endpoint to list folder contents
app.get("/folder-contents", (req, res) => {
  const folderPath = "./uploads"; // Replace with your desired folder path

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      res.status(500).json({ error: "Error reading folder contents" });
    } else {
      res.json(files);
    }
  });
});

app.post("/uplod", upload.single("image"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path);
    res.json({ url: result.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error uploading image" });
  }
});
// Endpoint to serve the image
app.get("/uploads/:filename", (req, res) => {
  const filename = req.params.filename;
  const imagePath = __dirname + "/uploads/" + filename; // Replace with your image directory
  console.log("path", imagePath);
  res.sendFile(imagePath, (err) => {
    if (err) {
      res.status(404).send("Image not found");
    }
  });
});

const __dirname = import.meta.dirname;
console.log(__dirname);

// Schedule automatic deletion of past events (run as a separate process)
const deletePastEvents = async () => {
  const oneWeekAgo = moment().subtract(7, "days").startOf("day");
  const eventsToDelete = await eventModel.find({ date: { $lt: oneWeekAgo } });
  for (const event of eventsToDelete) {
    if (event.imageUrl) {
      const imagePath = path.join(__dirname, event.imageUrl.split("/").pop());
      console.log("image path", imagePath);
      try {
        fs.unlinkSync(imagePath);
        console.log(`Deleted image for event: ${event._id}`);
      } catch (error) {
        console.error(`Error deleting image for event ${event._id}:`, error);
      }
    }
  }
  await eventModel.deleteMany({ date: { $lt: oneWeekAgo } }); // Delete past events older than one week
  console.log("Past events deleted");
};

// Update event status automatically every day (can be customized)
const updateEventStatuses = async () => {
  console.log("event update");
  const tomorrow = moment().add(1, "days").startOf("day"); // Get tomorrow's date
  const events = await eventModel.find();
  for (const event of events) {
    const today = moment().startOf("day"); // Get today's date without time

    if (event.date < today) {
      event.status = "Past";
    } else if (
      event.date.toString().slice(0, 15) === today.toString().slice(0, 15)
    ) {
      event.status = "Today";
    } else if (
      event.date.toString().slice(0, 15) === tomorrow.toString().slice(0, 15)
    ) {
      event.status = "Tomorrow";
    } else {
      event.status = "Upcoming";
    }
    await event.save();
  }

  console.log("Event statuses updated");
};
cron.schedule("19 13 * * *", deletePastEvents);
cron.schedule("21 11 * * *", updateEventStatuses);

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
