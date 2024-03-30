import { Router } from "express";
import  { isAuthenticatedUser, authorizeRoles } from "../middlewares/auth.js";
import { signUp, login, getAllUsers, getUser, forgotPassword, resetPassword } from "../controllers/userController.js";

//TODO - import { requireSignIn } from "../helpers/authHelpers.js";

const router = Router();

router.post("/signup", signUp);
router.post("/login", login);
router.post("/users", getAllUsers);
router.get("/:id", isAuthenticatedUser, getUser);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);


export default router;

