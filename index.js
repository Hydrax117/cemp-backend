// Importing required modules
import express from "express";
import { connectToDB } from "./config/database.js";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import dotenv from "dotenv";

import cookieParser from "cookie-parser";

import cron from "node-cron";
import eventModel from "./models/eventModel.js";
import moment from "moment";
import eventRoutes from "./routes/eventRoutes.js";

dotenv.config();
connectToDB();
// Create an Express application
const app = express();

//Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());


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
  const tomorrow = moment().add(1, "days").startOf("day"); // Get tomorrow's date
  const events = await eventModel.find()
   for(const event of events){
  const today = moment().startOf("day"); // Get today's date without time
 
    if (event.date < today) {
      event.status = 'Past';
    }
    else if (event.date.toString().slice(0,15) === today.toString().slice(0,15)) {
      event.status = 'Today';
    } else if (event.date.toString().slice(0,15) === tomorrow.toString().slice(0,15)) {
      event.status = 'Tomorrow';
    } else {
      event.status = 'Upcoming';
    }
    await event.save()
  }

  console.log("Event statuses updated");
};
cron.schedule("47 12 * * *", deletePastEvents);
cron.schedule("19 13 * * *", updateEventStatuses);




// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
