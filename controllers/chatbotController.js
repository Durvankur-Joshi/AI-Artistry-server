import * as dotenv from "dotenv";
import axios from "axios";
import ChatbotInteraction from "../models/ChatbotInteraction.js";

dotenv.config();

const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct";
const API_KEY = process.env.HUGGING_FACE_API_KEY;

export const chatbotResponse = async (req, res) => {
  try {
    const { prompt, userId, sessionId } = req.body;


    // Send a request to the Hugging Face API
    const huggingFaceResponse = await axios.post(
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

    // Log API response for debugging
    console.log("Hugging Face API Response:", huggingFaceResponse.data);

    // Extract the chatbot's reply from the API response
    const rawReply =
      Array.isArray(huggingFaceResponse.data) && huggingFaceResponse.data[0]?.generated_text
        ? huggingFaceResponse.data[0].generated_text
        : "Sorry, I couldn't understand your request.";

    // Format the reply
    const formattedReply = formatReply(rawReply);

    // Save the interaction to the database
    const newInteraction = new ChatbotInteraction({
      userId,
      sessionId,
      prompt,
      reply: formattedReply,
    });

    await newInteraction.save();
    
    console.log("Formatted Reply:", formattedReply);

    // Send the formatted reply back to the client
    return res.status(200).json({
      success: true,
      prompt,
      reply: formattedReply,
      interactionId: newInteraction._id,
    });
  } catch (error) {
    console.error("Error communicating with Hugging Face API:", error);

    // Handle API-specific errors
    if (error.response) {
      const errorMessage = error.response.data?.error || "An error occurred with the Hugging Face API.";
      return res.status(error.response.status).json({
        success: false,
        error: errorMessage,
      });
    }

    // Handle generic errors
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
};

// Helper function to format the reply
const formatReply = (reply) => {
  if (!reply) return reply;

  // Escape HTML special characters to prevent injection
  const escapeHtml = (text) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Apply formatting after escaping
  const escapedReply = escapeHtml(reply);

  return escapedReply
    .replace(/##(.*?)##/g, "<b><u>$1</u></b>") // Bold and underline for `##text##`
    .replace(/^### (.*?)/gm, "<b><u>$1</u></b>") // Bold and underline for headings starting with `###`
    .replace(/\*\*\*?(.*?)\*\*\*?/g, "<b>$1</b>") // Bold for `***text***` or `**text**`
    .replace(/\b\d+(\.\d+)?\s*(miles|minutes|hours|mph)\b/g, "<span style='color:blue;'>$&</span>") // Highlight numbers with units
    .replace(/\\\[([^\\]+?)\\\]/g, "<i>$1</i>") // Italicize LaTeX-like math formulas
    .replace(/\\boxed{(\d+)}/g, "<span style='color:green; font-weight:bold;'>$1</span>") // Highlight boxed results
    .replace(/\n/g, "<br>"); // Line breaks for newlines
};
