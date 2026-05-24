import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    role: String,
    content: String,
    timestamp: String,
  },
  {
    _id: false,
  },
);

const ConversationSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      default: "New Chat",
    },

    messages: [MessageSchema],

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
