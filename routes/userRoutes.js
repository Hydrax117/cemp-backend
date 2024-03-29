import { Router } from "express";

import { signUp, login } from "../controllers/userController.js";

//TODO - import { requireSignIn } from "../helpers/authHelpers.js";

const router = Router();

router.post("/signup", signUp);
router.post("/logim", login);


export default router;

