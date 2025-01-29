import * as dotenv from "dotenv";
import axios from "axios";
import { createError } from "../error.js"; // Ensure correct path

dotenv.config();

const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/stable-diffusion-v1-5";
const API_KEY = process.env.HUGGING_FACE_API_KEY;

export const generateImage = async (req, res, next) => {
  try {
    const { prompt, quality = "high", resolution = "512x512" } = req.body;

    // Preprocess prompt for better results
    const enhancedPrompt = `${prompt}, high detail, ultra realism, ${quality}, ${resolution}`;

    const response = await axios.post(
      HUGGING_FACE_API_URL,
      {
        inputs: enhancedPrompt,
        options: {
          wait_for_model: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer", // Ensure response is treated as binary data
      }
    );

    // Log the response for debugging
    console.log("Hugging Face API response received.");

    // Convert binary response to Base64
    const base64Image = Buffer.from(response.data, "binary").toString("base64");

    // Return Base64 string in JSON response
    return res.status(200).json({
      photo: base64Image,
      metadata: {
        prompt: enhancedPrompt,
        quality,
        resolution,
      },
    });
  } catch (error) {
    // Handle API-specific errors
    console.error("Error response from Hugging Face API:", error);

    if (error.response) {
      if (error.response.status === 503 && error.response.data.error.includes("is currently loading")) {
        const estimatedTime = error.response.data.estimated_time || "a few moments";
        return next(createError(503, `Model is currently loading. Please try again in ${estimatedTime} seconds.`));
      }
      return next(createError(error.response.status, error.response.data.error));
    } else if (error.code === "ENOTFOUND") {
      return next(createError(500, "Unable to reach Hugging Face API. Please check your network connection."));
    }
    next(createError(500, error.message));
  }
};
