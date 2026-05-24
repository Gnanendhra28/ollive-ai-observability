import mongoose, { Schema, models, model } from "mongoose";

const MessageSchema = new Schema(
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
  { _id: false },
);

const ConversationSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
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

const Conversation =
  models.Conversation || model("Conversation", ConversationSchema);

export default Conversation;
