// Importing required modules
import express from "express";
import { connectToDB } from "./config/database.js";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import dotenv from "dotenv";
import cron from "node-cron";
import eventModel from "./models/eventModel.js";
import moment from "moment";
import eventRoutes from "./routes/eventRoutes.js";

//import { updateEventStatuses } from "./models/eventUpdate.js";
//const express = require("express");
//const connectToDB = require("./config/database.js");
//const cors = require("cors");
//const userRoutes = require("./routes/userRoutes.js");

dotenv.config();
connectToDB();
// Create an Express application
const app = express();

//Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//API routes
app.use("/api/users", userRoutes);
app.use("/api/event", eventRoutes);

// Define routes
app.get("/", (req, res) => {
  res.send("Hello, World!");
});



// Schedule automatic deletion of past events (run as a separate process)
const deletePastEvents = async () => {
  const oneWeekAgo = moment().subtract(7, "days").startOf("day");
  await eventModel.deleteMany({ date: { $lt: oneWeekAgo } }); // Delete past events older than one week
  console.log("Past events deleted");
};



// Update event status automatically every day (can be customized)
const updateEventStatuses = async () => {
  const today = moment().startOf("day"); // Get today's date without time
  console.log(today);
  const tomorrow = moment().add(1, "days").startOf("day"); // Get tomorrow's date
  await eventModel.updateMany(
    {},
    {
      $set: {
        status: {
          $cond: [
            { $lt: ["$date", today] }, // past (remaining)
            "past",
            {
              $eq: [
                moment({ date: "$date" }).format("YYYY-MM-DD"),
                today.format("YYYY-MM-DD"),
              ],
            }, // today
            "today",
            "upcoming", // upcoming
          ],
        },
      },
    }
  );

  console.log("Event statuses updated");
};
cron.schedule("47 12 * * *", deletePastEvents);
cron.schedule("47 12 * * *", updateEventStatuses);




// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
