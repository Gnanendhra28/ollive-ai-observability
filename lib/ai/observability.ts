import { metrics } from "./metrics";

export const logAIRequest = ({
  model,
  messageCount,
  provider = "groq",
}: {
  model: string;
  messageCount: number;
  provider?: string;
}) => {
  metrics.requests += 1;

  console.log("\n========== AI REQUEST ==========");
  console.log("Provider:", provider);
  console.log("Model:", model);
  console.log("Messages:", messageCount);
  console.log("Timestamp:", new Date().toISOString());
};

export const logAIResponse = ({ latency }: { latency: number }) => {
  metrics.totalLatency += latency;

  console.log("\n========== AI RESPONSE ==========");
  console.log("Latency:", latency, "ms");

  const averageLatency =
    metrics.requests > 0 ? metrics.totalLatency / metrics.requests : 0;

  console.log("Average Latency:", averageLatency.toFixed(2), "ms");

  console.log("Total Requests:", metrics.requests);
};

export const logAIError = (error: unknown) => {
  metrics.errors += 1;

  console.error("\n========== AI ERROR ==========");
  console.error(error);

  console.log("Total Errors:", metrics.errors);
};
