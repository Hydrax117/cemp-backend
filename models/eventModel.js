/* This code snippet is defining a Mongoose schema for an event in a Node.js application. Here's a
breakdown of what each part is doing: */
import mongoose from "mongoose";
import moment from "moment";
/* This code snippet is defining a Mongoose schema for an event in a Node.js application. The
`mongoose.Schema()` function is used to define the structure of the document that will be stored in
the MongoDB database. */
const EventShema = mongoose.Schema({
  title: String,
  description: String,
  interestedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  date: Date,
  status: {
    type: String,
  },

  imageUrl: {
    type: String,
    required: true,
  },
  imagePublicId: String,
  area: {
    type: String,
    // enum: [
    //   "Backend",
    //   "Frontend",
    //   "Novice",
    //   "Product Designer",
    //   "UI/UX",
    //   "Web3",
    // ],
    // default: "Novice",
  },
  eventType: {
    type: String,
    enum: ["Free", "Paid"],
    // default: "Novice",
  },
  tickets: [{ name: String, price: Number }],
  startTime: { type: String },
  endTime: { type: String },
  location: { type: String },
  organizer: [{ name: String, email: String, contact: String }],
  speakers: [],
  createdAt: { type: Date, default: Date.now },
  maxAttendees: { type: Number }, // Maximum number of attendees allowed (optional)
});
EventShema.index({
  title: "text",
  description: "text",
  area: "text",
  location: "text",
}); // Create text index

EventShema.pre("save", function (next) {
  // const event = this;
  // const today = moment().startOf("day"); // Get today's date without time
  // console.log("today",today,"event date",event.date.toString().slice(0,15))
  const tomorrow = moment().add(1, "days").startOf("day"); // Get tomorrow's date
  // event.status =
  //   event.date < today ? "past" : event.date.toString().slice(0,15) === today.toString().slice(0,15) ? "today" : "upcoming";
  const event = this;
  // const today = new Date().setHours(0, 0, 0, 0); // Reset time to midnight
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
  next();
});

const eventModel = mongoose.model("Events", EventShema);
export default eventModel;
