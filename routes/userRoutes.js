import { Router } from "express";
import  { authorizeRoles, isAuthenticatedUser } from "../middlewares/auth.js";
import { signUp, login, getAllUsers, getUser, forgotPassword, resetPassword, updateUser, deleteUser, logout } from "../controllers/userController.js";

//TODO - import { requireSignIn } from "../helpers/authHelpers.js";
const router = Router();

router.post("/signup", signUp);
router.post("/login", login);
router.get("/users", getAllUsers);
router.get("/:id", getUser);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.put("/me/update", isAuthenticatedUser, updateUser);
router.route("/delete/:id").delete(isAuthenticatedUser, authorizeRoles("community-admin"), deleteUser);
router.get("/logout", logout);

export default router;

