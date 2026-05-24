import mongoose, { Schema, models } from "mongoose";

const DocumentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    chunks: [
      {
        type: String,
      },
    ],

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export default models.Document || mongoose.model("Document", DocumentSchema);
