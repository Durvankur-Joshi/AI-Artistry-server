import * as dotenv from "dotenv";
import axios from "axios";
// import ChatInteraction from "../models/ChatInteraction.js";
import ChatbotInteraction from "../models/ChatbotInteraction.js";

dotenv.config();

const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct";
const API_KEY = process.env.HUGGING_FACE_API_KEY;

export const chatbotResponse = async (req, res, next) => {
  try {
    const { prompt, userId, sessionId } = req.body;

    // Send a request to the Hugging Face API
    const response = await axios.post(
      HUGGING_FACE_API_URL,
      {
        inputs: prompt,
        options: {
          wait_for_model: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Log the full API response for debugging
    console.log("Hugging Face API Response:", response.data);

    // Validate and extract the chatbot reply
    const chatbotReply =
      Array.isArray(response.data) && response.data[0]?.generated_text
        ? response.data[0].generated_text
        : "Sorry, I couldn't understand your request.";

    // Save the interaction to the database
    const newInteraction = new ChatbotInteraction({
      userId,
      sessionId,
      prompt,
      reply: chatbotReply,
    });

    await newInteraction.save();

    // Return the chatbot reply
    return res.status(200).json({
      success: true,
      prompt,
      reply: chatbotReply,
      interactionId: newInteraction._id,
    });
  } catch (error) {
    console.error("Error communicating with Hugging Face API:", error);

    if (error.response) {
      const errorMessage =
        error.response.data.error || "An unknown error occurred with the Hugging Face API.";
      return res.status(error.response.status).json({
        success: false,
        error: errorMessage,
      });
    }

    // Handle generic errors
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
};
