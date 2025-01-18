import express from "express";
import { chatbotResponse } from "../controllers/chatController.js";

const router = express.Router();

router.post("/chat", chatbotResponse);

export default router;
