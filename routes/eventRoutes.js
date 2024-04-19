import { Router } from "express";
const router = Router();
import { createNewEvent,updateEvent,deleteEvent,getOneEvent,searchEvent,eventRegistration,getAllEvents,registeredUsers,eventUnRegister } from "../controllers/eventController.js";
import { isAuthenticatedUser } from "../middlewares/auth.js";
router.post("/create", createNewEvent);
router.get("/search", searchEvent);
router.get("/get-one-event", getOneEvent);
router.get("/all", getAllEvents);
router.get("/:id/registered",registeredUsers)
router.put("/update/:id", updateEvent);
router.delete("/delete/:id", deleteEvent);
router.post("/:id/register",eventRegistration)
router.delete('/:id/unregister',isAuthenticatedUser,eventUnRegister)

export default router;
