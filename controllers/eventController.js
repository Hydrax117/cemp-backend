import eventModel from "../models/eventModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendEmail } from "../utils/email.js";
import HttpError from "../utils/http-error.js";
import qrcode from "qrcode";
import fs from "fs/promises";
import moment from "moment";
import User from "../models/userModel.js";

// Function to generate QR code
async function generateQRCode(data) {
  try {
    return await qrcode.toDataURL(data);
  } catch (err) {
    console.error("Error generating QR code:", err);
    return null;
  }
}

const createNewEvent = catchAsync(async (req, res, next) => {
  try {
    var eventTitle = req.body.title;
    var eventDescription = req.body.description;
    if (eventTitle && eventDescription) {
      var findEvent = await eventModel.find({ title: eventTitle });
      if (findEvent.length > 0) {
        return next(new HttpError("event already exsist"), 500);
      }
      var event = new eventModel(req.body);
      await event.save();
      return res.json({
        success: true,
        data: event,
      });
    } else {
      return next(new HttpError("title is required already exsist"), 500);
    }
  } catch (error) {
    return next(new HttpError(error.message), 500);
  }
});

const getAllEvents = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = parseInt(req.query.limit) || 10; // Default to 10 events per page
  try {
    const totalEvents = await eventModel.countDocuments(); // Count total events
    const events = await eventModel
      .find()
      .skip((page - 1) * limit) // Skip events for previous pages
      .limit(limit) // Limit results to current page
      .sort({ date: 1 }); // Sort by date (optional)
    const totalPages = Math.ceil(totalEvents / limit);

    res.json({
      status: "success",
      code: 200,
      events,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    return next(new HttpError(err.message));
  }
});

const getOneEvent = catchAsync(async (req, res, next) => {
  var eventId = req.params.eventId;
  try {
    var findOneEvent = await eventModel.findOne({ _id: eventId });
    if (findOneEvent) {
      return res.send({
        message: "success",
        data: findOneEvent,
      });
    } else {
      return next(new HttpError("event does not exsist"), 500);
    }
  } catch (error) {
    return next(new HttpError(error.message), 500);
  }
});

const searchEvent = catchAsync(async (req, res, next) => {
  var query = req.query.text;
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = parseInt(req.query.limit) || 10; // Default to 10 events per page

  try {
    const searchCriteria = {
      $text: { $search: query },
    };

    var findEvent = await eventModel.find(searchCriteria);
    if (findEvent.length > 0) {
      const totalEvents = await eventModel.countDocuments(searchCriteria); // Count total events
      const events = await eventModel
        .find(searchCriteria)
        .skip((page - 1) * limit) // Skip events for previous pages
        .limit(limit) // Limit results to current page
        .sort({ date: 1 }); // Sort by date
      const totalPages = Math.ceil(totalEvents / limit);
      return res.json({
        events,
        totalPages,
        currentPage: page,
      });
    } else {
      return res.json({
        success: true,
        message: "no events found",
      });
    }
  } catch (error) {
    return next(new HttpError(error.message));
  }
});

const eventRegistration = catchAsync(async (req, res, next) => {
  const eventId = req.params.eventId;
  const username = req.user._id; // Replace with appropriate user identification method
  const event = await eventModel.findById(eventId);
  const user = await User.findOne({ _id: username });

  try {
    if (!event) {
      return next(new HttpError("event not found", 500));
    }

    if (event.interestedUsers.includes(username)) {
      return next(new HttpError("user already registered for this event", 500));
    }
    if (
      event.maxAttendees &&
      event.interestedUsers.length >= event.maxAttendees
    ) {
      return next(new HttpError("event is full"));
    }
    const formattedDate = moment(event?.date).format("dddd MMM DD YYYY");

    const qrCodeData = `${req.user.fullName}-${event.title}--${formattedDate}-${req.user.email}`;
    const qrCodeImage = await generateQRCode(qrCodeData);
    event.interestedUsers.push(username);
    user.interestedEvents.push(event._id);
    await user.save();
    const updatedEvent = await event.save();
    try {
      await sendEmail({
        email: req.user.email,
        subject: `RSVP Confirmation for ${event.title}`,
        message: `Dear ${req.user.email}, you have successfully registered for ${event.title}`,
        html: `
        <h1>RSVP Confirmation</h1>
        <p>Dear ${req.user.fullName},</p>
        <p>Thank you for registering for "${event.title}". Here are the event details:</p>
        <ul>
          <li>Date: ${formattedDate}</li>
          <li>Time: ${event.startTime}</li>
          <li>Location: ${event.location}</li>
        </ul>
        <p>Please find your QR code ticket attached below. Present this at the event entrance.</p>
        <img src="${qrCodeImage}" alt="QR Code Ticket"/>
        <p>We look forward to seeing you at the event!</p>
        <p>Best regards,<br>Event Organizers</p>
      `,
        attachments: [
          {
            filename: "qr-code.png",
            content: qrCodeImage.split("base64,")[1],
            encoding: "base64",
          },
        ],
      });
    } catch (error) {
      console.error("Error sending email:", error);
      return next(new HttpError("Message not sent Successfully", 500));
    }
    res.json({
      status: "success",
      message: "Successfully registered for the event",
    });
  } catch (err) {
    return next(new HttpError(err.message));
  }
});

const eventUnRegister = catchAsync(async (req, res, next) => {
  const eventId = req.params.eventId;
  const userId = req.user._id || req.query.userId;
  // console.log("current user", userId);

  try {
    const event = await eventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const userIndex = event.interestedUsers.indexOf(userId);
    if (userIndex === -1) {
      return res.status(400).json({ message: "Not registered for this event" });
    }

    event.interestedUsers.splice(userIndex, 1);

    await event.save();
    res.json({ message: "Successfully unregistered from the event" });
  } catch (error) {
    return next(new HttpError(error.message));
  }
});

const registeredUsers = catchAsync(async (req, res, next) => {
  const eventId = req.params.id;

  try {
    const event = await eventModel
      .findById(eventId)
      .select("title interestedUsers")
      .populate("interestedUsers")
      .select("email"); // Select only interestedUsers field
    if (!event) {
      return next(new HttpError("event not found", 404));
    }
    // this code loops through the users that registered for that events and select only thier names and email
    const users = [];
    let interestedUsers = event.interestedUsers;
    for (let i = 0; i < interestedUsers.length; i++) {
      users.push({
        email: interestedUsers[i].email,
        name: interestedUsers[i].fullName,
      });
    }

    return res.json({
      status: 200,
      message: `list all users that registered for ${event.title}`,
      data: users,
    });
  } catch (error) {
    return next(new HttpError(error.message));
  }
});

const updateEvent = catchAsync(async (req, res, next) => {
  try {
    const updatedEvent = await eventModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedEvent) {
      return next(new HttpError("event not found", 404));
    }
    res.json(updatedEvent);
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
});

const deleteEvent = catchAsync(async (req, res, next) => {
  try {
    const deletedEvent = await eventModel.findByIdAndDelete(req.params.id);
    if (!deletedEvent) {
      return next(new HttpError("event not found", 404));
    }
    res.json({ message: "Event deleted" });
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
});

const popuparEvents = catchAsync(async (req, res, next) => {
  try {
    const popularEvents = await eventModel.aggregate([
      {
        $project: {
          title: 1,
          interestedUsers: 1,
          numInterestedUsers: { $size: "$interestedUsers" },
          imageUrl: 1,
          date: 1,
          status: 1,
          area: 1,
          location: 1,
          organizer: 1,
        },
      },
      {
        $sort: { numInterestedUsers: -1 },
      },
      {
        $limit: 5, // Limit to top 5 events
      },
    ]);

    // console.log("Most popular events:", popularEvents);
    return res.send(popularEvents);
  } catch (err) {
    return next(new HttpError(err.message));
  }
});
export {
  createNewEvent,
  getOneEvent,
  searchEvent,
  deleteEvent,
  updateEvent,
  eventRegistration,
  getAllEvents,
  registeredUsers,
  eventUnRegister,
  popuparEvents,
};
