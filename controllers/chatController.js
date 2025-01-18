import * as dotenv from "dotenv";
import axios from "axios";
import { createError } from "../error.js"; // Ensure the error utility is correctly imported

dotenv.config();

// Hugging Face API details
const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-11B-Vision-Instruct";
const API_KEY = process.env.HUGGING_FACE_API_KEY;

export const chatbotResponse = async (req, res, next) => {
  try {
    const { prompt } = req.body;

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

    // Log API response for debugging
    console.log("Hugging Face API response:", response.data);

    // Extract the chatbot response
    const chatbotReply = response.data.generated_text;

    // Return chatbot response in JSON format
    return res.status(200).json({ reply: chatbotReply });
  } catch (error) {
    // Handle API errors
    console.error("Error response from Hugging Face API:", error);

    if (error.response) {
      // Handle specific error responses from the API
      if (error.response.status === 503 && error.response.data.error.includes("is currently loading")) {
        const estimatedTime = error.response.data.estimated_time || "a few moments";
        return next(
          createError(503, `Model is currently loading. Please try again in ${estimatedTime} seconds.`)
        );
      }
      return next(createError(error.response.status, error.response.data.error));
    } else if (error.code === "ENOTFOUND") {
      // Handle network/DNS errors
      return next(createError(500, "Unable to reach Hugging Face API. Please check your network connection."));
    }
    // Forward generic error to error handling middleware
    next(createError(500, error.message));
  }
};
