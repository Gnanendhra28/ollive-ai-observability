import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  role: String,
  content: String,
  model: String,
  metadata: Object,
});

const ConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    title: String,

    messages: [MessageSchema],

    pinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Conversation =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", ConversationSchema);

export default Conversation;
