"use client";

import { useState } from "react";

export default function UploadDocument() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleUpload = async () => {
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      const data = await response.json();

      alert(`Uploaded successfully! Chunks: ${data.chunkCount}`);

      setTitle("");
      setContent("");
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    }
  };

  return (
    <div className="border border-white/10 bg-white/5 rounded-2xl p-4 space-y-3 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Knowledge Upload</h2>

        <span className="text-xs text-gray-400">RAG Pipeline</span>
      </div>

      <input
        type="text"
        placeholder="Document Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white outline-none"
      />

      <textarea
        placeholder="Paste document content..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white outline-none h-28 resize-none"
      />

      <button
        onClick={handleUpload}
        className="bg-cyan-500 hover:bg-cyan-400 transition px-4 py-2 rounded-lg text-black font-medium"
      >
        Upload Document
      </button>
    </div>
  );
}
