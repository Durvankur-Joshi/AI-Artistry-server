import * as dotenv from "dotenv";
import axios from "axios";
// import { createError } from "../error.js"; // Ensure correct path
import { createError } from "../error.js";

dotenv.config();

const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/Melonie/text_to_image_finetuned";
const API_KEY = process.env.HUGGING_FACE_API_KEY;

export const generateImage = async (req, res, next) => {
  try {
    const { prompt } = req.body;

    const response = await axios.post(HUGGING_FACE_API_URL, {
      inputs: prompt,
      options: {
        wait_for_model: true,
      },
    }, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      responseType: 'arraybuffer', // Ensure response is treated as binary data
    });

    // Log the entire response for debugging
    console.log("Hugging Face API response:", response.data);

    // Convert Buffer to Base64 string
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');

    // Return Base64 string in JSON response
    return res.status(200).json({ photo: base64Image });
  } catch (error) {
    // Handle errors
    console.error("Error response from Hugging Face API:", error);

    if (error.response) {
      // Handle specific error responses from the API
      if (error.response.status === 503 && error.response.data.error.includes("is currently loading")) {
        const estimatedTime = error.response.data.estimated_time || "a few moments";
        return next(createError(503, `Model is currently loading. Please try again in ${estimatedTime} seconds.`));
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
