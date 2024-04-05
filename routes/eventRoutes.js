import { Router } from "express";
const router = Router();
import { createNewEvent,getOneEvent,searchEvent,eventRegistration,getAllEvents,registeredUsers } from "../controllers/eventController.js";
router.post("/create", createNewEvent);
router.get("/search", searchEvent);
router.get("/get-one-event", getOneEvent);
router.get("/all", getAllEvents);
router.get("/:id/registered",registeredUsers)
// router.put("/update/:id", updateAnEvent);
// router.delete("/delete/:id", deleteEvent);
router.post("/:id/register",eventRegistration)

export default router;
