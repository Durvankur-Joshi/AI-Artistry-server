import express from "express";

import { UserLogin , UserRegister } from "../controllers/User.js";
// import { verifyToken } from "../middleware/VarifyUser.js";

const router = express.Router()

router.post("/SignUp" , UserRegister)
router.post("/SignIn" , UserLogin)


export default router