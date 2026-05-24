import Groq from "groq-sdk";
import { retrieveRelevantChunks } from "./retrieve";
import { ProviderType } from "./providers";
import { logAIError, logAIRequest, logAIResponse } from "./observability";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

type ChatMessage = ChatCompletionMessageParam;

export async function generateStreamingResponse({
  messages,
  model,
  provider = "groq",
}: {
  messages: ChatMessage[];
  model: string;
  provider?: ProviderType;
}) {
  const start = Date.now();

  try {
    logAIRequest({
      model,
      messageCount: messages.length,
      provider,
    });

    const latestMessage = messages[messages.length - 1]?.content || "";

    const relevantChunks = await retrieveRelevantChunks(String(latestMessage));

    const systemPrompt = `
You are an AI observability assistant.

IMPORTANT:
You MUST prioritize and use the uploaded knowledge below when answering.

If the uploaded knowledge contains relevant information, answer primarily from it.

UPLOADED KNOWLEDGE:
${relevantChunks.join("\n")}

Keep answers concise and grounded in the uploaded knowledge.
`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
      ],
      model,
      stream: true,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || "";

            controller.enqueue(encoder.encode(content));
          }

          const latency = Date.now() - start;

          logAIResponse({
            latency,
          });

          controller.close();
        } catch (error) {
          logAIError(error);
          controller.error(error);
        }
      },
    });

    return stream;
  } catch (error) {
    logAIError(error);
    throw error;
  }
}
