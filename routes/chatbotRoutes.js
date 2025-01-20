import express from "express";
import {
//   handleChatbotInteraction,
//   getUserInteractions,
chatbotResponse
} from "../controllers/chatbotController.js";

const router = express.Router();

// Route to handle chatbot interaction
router.post("/interact", chatbotResponse);

// Route to fetch user interactions
// router.get("/interactions/:userId", getUserInteractions);

export default router;
