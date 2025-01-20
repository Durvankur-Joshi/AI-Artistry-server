import mongoose from "mongoose";

const chatbotInteractionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    prompt: {
      type: String,
      required: true,
    },
    reply: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      required: false,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ChatbotInteraction", chatbotInteractionSchema);
