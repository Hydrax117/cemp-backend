import eventModel from "../models/eventModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import HttpError from "../utils/http-error.js";

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



const getAllEvents = catchAsync(async (req, res,next) => {
  try {
    const events = await eventModel.find();
    res.json(events);
  } catch (err) {
    return next(new HttpError(err.message))
  }
});



const getOneEvent = catchAsync(async (req, res,next) => {
  var query = req.query;
  try {
    var findOneEvent = await eventModel.findOne(query);
    if (findOneEvent) {
      return res.send({
        message: "success",
        data: findOneEvent,
      });
    } else {
      return next(new HttpError("event does not exsist"), 500);

    }
  } catch (error) {
    return next(new HttpError(error.message), 500);  }
});



const searchEvent = catchAsync(async (req, res,next) => {
  var query = req.query.text;
  try {
    const searchCriteria = {
      $text: { $search: query },
    };

    var findEvent = await eventModel.find(searchCriteria);
    if (findEvent.length > 0) {
      return res.json({
        success: true,
        data: findEvent,
      });
    }else{
      return res.json({
        success: true,
        message:"no events found"
      });
    }
  } catch (error) {
   return next(new HttpError(error.message))
  }
});



const eventRegistration = catchAsync( async (req, res,next) => {
  const eventId = req.params.id;
  const username = req.body.id; // Replace with appropriate user identification method

  try {
    const event = await eventModel.findById(eventId);
    if (!event) {
      return next(new HttpError("event not found",500))
    }

    if (event.interestedUsers.includes(username)) {
      return next(new HttpError("user already registered for this event",500));
    }

    event.interestedUsers.push(username);
    const updatedEvent = await event.save();
    res.json({ message: 'Successfully registered for the event' });
  } catch (err) {
    return next(new HttpError(err.message));
  }
});


const registeredUsers = catchAsync(async (req, res,next) => {
  const eventId = req.params.id;

  try {
    const event = await eventModel.findById(eventId).select('title interestedUsers').populate('interestedUsers').select('email'); // Select only interestedUsers field
    if (!event) {
      return next(new HttpError("event not found",404))
    }
    return res.json({
      status:200,
      message:`list all users that registered for ${event.title}`,
      data:event.interestedUsers
    }
    )

  } catch (error) {
    return next(new HttpError(error.message))
  }});


const updateEvent = catchAsync(async (req, res,next) => {
  try {
    const updatedEvent = await eventModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedEvent) {
      return next(new HttpError("event not found",404))
    }
    res.json(updatedEvent);
  } catch (error) {
    return next(new HttpError(error.message,500))
  }
})


const deleteEvent = catchAsync( async (req, res,next) => {
  try {
    const deletedEvent = await eventModel.findByIdAndDelete(req.params.id);
    if (!deletedEvent) {
      return next(new HttpError("event not found",404))
    }
    res.json({ message: "Event deleted" });
  } catch (error) {
    return next(new HttpError(error.message,500))
  }
})

export { createNewEvent,getOneEvent,searchEvent,deleteEvent,updateEvent,eventRegistration,getAllEvents,registeredUsers };
