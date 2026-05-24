import Document from "@/models/Document";

export async function retrieveRelevantChunks(query: string) {
  const keywords = query
    .toLowerCase()
    .split(" ")
    .filter((word) => word.length > 3);

  const regex = keywords.join("|");

  const documents = await Document.find({
    content: {
      $regex: regex,
      $options: "i",
    },
  });

  const chunks = documents.flatMap((doc: { chunks: string[] }) => doc.chunks);

  return chunks.slice(0, 3);
}
