import { Router } from "express";
import  { authorizeRoles } from "../middlewares/auth.js";
import { signUp, login, getAllUsers, getUser, forgotPassword, resetPassword } from "../controllers/userController.js";

//TODO - import { requireSignIn } from "../helpers/authHelpers.js";
const router = Router();

router.post("/signup", signUp);
router.post("/login", login);
router.get("/users", getAllUsers);
router.get("/:id", getUser);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);


export default router;

