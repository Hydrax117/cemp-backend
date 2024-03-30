import { Router } from "express";

import { signUp, login, getAllUsers, getUser, forgotPassword, resetPassword } from "../controllers/userController.js";

//TODO - import { requireSignIn } from "../helpers/authHelpers.js";

const router = Router();

router.post("/signup", signUp);
router.post("/login", login);
router.post("/users", getAllUsers);
router.post("/:id", getUser);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);


export default router;

