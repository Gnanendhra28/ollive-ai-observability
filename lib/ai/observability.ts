export const logAIRequest = ({
  model,
  messageCount,
}: {
  model: string;
  messageCount: number;
}) => {
  console.log("========== AI REQUEST ==========");
  console.log("Model:", model);
  console.log("Messages:", messageCount);
  console.log("Timestamp:", new Date().toISOString());
};

export const logAIResponse = ({ latency }: { latency: number }) => {
  console.log("========== AI RESPONSE ==========");
  console.log("Latency:", latency, "ms");
};

export const logAIError = (error: unknown) => {
  console.error("========== AI ERROR ==========");
  console.error(error);
};
