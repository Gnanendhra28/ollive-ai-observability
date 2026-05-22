import { evaluate } from "mathjs";

import { openai } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function generateChatCompletion(
  messages: ChatMessage[],
  conversationId: string,
) {
  const startTime = Date.now();

  try {
    const latestMessage = messages[messages.length - 1]?.content;

    // Detect mathematical expressions
    const mathRegex = /^[0-9+\-*/().%\s^sqrt]+$/i;

    if (latestMessage && mathRegex.test(latestMessage)) {
      try {
        const result = evaluate(latestMessage);

        const endTime = Date.now();

        const latency = endTime - startTime;

        await prisma.inferenceLog.create({
          data: {
            conversationId,

            provider: "mathjs",
            model: "local-math-engine",

            latencyMs: latency,

            status: "success",

            inputPreview: latestMessage.slice(0, 500),

            outputPreview: String(result).slice(0, 500),
          },
        });

        return {
          success: true,

          message: String(result),

          metadata: {
            provider: "MathJS",
            model: "local-math-engine",

            latency: latency,

            tokens: 0,
          },
        };
      } catch (mathError) {
        console.error(mathError);
      }
    }

    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",

      messages: [
        {
          role: "system",
          content: `
You are Ollive AI, an advanced AI infrastructure and observability assistant.

Behavior Rules:
- Perform arithmetic and symbol-based reasoning naturally.
- Interpret common mathematical expressions correctly.
- Answer technical questions clearly.
- Keep responses concise and intelligent.
`,
        },

        ...messages,
      ],
    });

    const endTime = Date.now();

    const latency = endTime - startTime;

    const assistantMessage = response.choices[0].message.content || "";

    await prisma.inferenceLog.create({
      data: {
        conversationId,

        provider: "groq",
        model: "llama-3.3-70b-versatile",

        latencyMs: latency,

        promptTokens: response.usage?.prompt_tokens,

        completionTokens: response.usage?.completion_tokens,

        totalTokens: response.usage?.total_tokens,

        status: "success",

        inputPreview: JSON.stringify(messages).slice(0, 500),

        outputPreview: assistantMessage.slice(0, 500),
      },
    });

    return {
      success: true,

      message: assistantMessage,

      metadata: {
        provider: "Groq",
        model: "llama-3.3-70b-versatile",

        latency: latency,

        tokens: response.usage?.total_tokens || 0,
      },
    };
  } catch (error: unknown) {
    const endTime = Date.now();

    const latency = endTime - startTime;

    await prisma.inferenceLog.create({
      data: {
        conversationId,

        provider: "groq",
        model: "llama-3.3-70b-versatile",

        latencyMs: latency,

        status: "error",

        errorMessage: error instanceof Error ? error.message : "Unknown error",

        inputPreview: JSON.stringify(messages).slice(0, 500),
      },
    });

    throw error;
  }
}
