import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const ConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      default: "New Chat",
    },

    messages: {
      type: [MessageSchema],
      default: [],
    },

    pinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.Conversation ||
  mongoose.model("Conversation", ConversationSchema);
