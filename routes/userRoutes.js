import { Router } from "express";
import { authorizeRoles, isAuthenticatedUser } from "../middlewares/auth.js";
import {
    signUp,
    login,
    getAllUsers,
    getUser,
    forgotPassword,
    resetPassword,
    updateUser,
    deleteUser,
    logout,
    updatePassword,
    updateUserRole,
    searchUser
} from "../controllers/userController.js";

//TODO - import { requireSignIn } from "../helpers/authHelpers.js";
const router = Router();

router.post("/signup", signUp);
router.post("/login", login);
router.get("/users", getAllUsers);
router.get("/:id", getUser);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.put("/me/update", isAuthenticatedUser, updateUser);
router.put("/me/update-password", isAuthenticatedUser, updatePassword);
router
    .route("/delete/:id")
    .delete(isAuthenticatedUser, authorizeRoles("community-admin"), deleteUser);
router
    .route("/assign-role/:id")
    .put(isAuthenticatedUser, authorizeRoles("community-admin"), updateUserRole);
router.get("/logout", logout);
router.get("/me/search", searchUser);

export default router;
