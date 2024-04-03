/* This code snippet is defining a Mongoose schema for an event in a Node.js application. Here's a
breakdown of what each part is doing: */
const { default: mongoose } = require("mongoose");

const moment = require("moment"); // for date calculations

/* This code snippet is defining a Mongoose schema for an event in a Node.js application. The
`mongoose.Schema()` function is used to define the structure of the document that will be stored in
the MongoDB database. */
const EventShema = mongoose.Schema({
  title: String,
  description: String,
  registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  date: Date,
  status: String,
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
  const now = moment();
  console.log(now);

  // Calculate status based on date
  if (event.date < now) {
    event.status = "past";
  } else if (moment(event.date).isSame(now, "day")) {
    event.status = "today";
  } else if (moment(event.date).isAfter(now, "day")) {
    event.status = "upcoming";
  }

  next();
});

module.exports = mongoose.model("events", EventShema);
