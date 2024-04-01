import { Router } from "express";
import  { authorizeRoles, isAuthenticatedUser } from "../middlewares/auth.js";
import { signUp, login, getAllUsers, getUser, forgotPassword, resetPassword, updateUser, deleteUser, logout, updatePassword } from "../controllers/userController.js";

//TODO - import { requireSignIn } from "../helpers/authHelpers.js";
const router = Router();

router.post("/signup", signUp);
router.post("/login", login);
router.get("/users", getAllUsers);
router.get("/:id", getUser);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
//router.put("/me/update", isAuthenticatedUser, updateUser);
//router.put("/me/update-password", isAuthenticatedUser, updatePassword);
//router.route("/delete/:id").delete(isAuthenticatedUser, authorizeRoles("community-admin"), deleteUser);
router.put("/me/update-password", updatePassword)
router.get("/logout", logout);

// TODO - Remove unprotected routes
router.put("/me/update", updateUser);
router.delete("/delete/:id", deleteUser);

export default router;

