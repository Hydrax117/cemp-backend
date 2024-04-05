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
  area: {
    type: String,
    enum: [
      "Backend",
      "Frontend",
      "Novice",
      "Product Designer",
      "UI/UX",
      "Web3",
    ],
    default: "Novice",
  },
});
EventShema.index({ title: "text", description: "text", field: "text" }); // Create text index

EventShema.pre("save", function (next) {
  const event = this;
  const today = moment().startOf("day"); // Get today's date without time
  const tomorrow = moment().add(1, "days").startOf("day"); // Get tomorrow's date
  event.status =
    event.date < today ? "past" : event.date === today ? "today" : "upcoming";
  next();
});

const eventModel = mongoose.model("Events", EventShema);
export default eventModel;
