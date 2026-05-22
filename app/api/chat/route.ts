import { streamText } from "ai";

import { groq } from "@ai-sdk/groq";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),

      system: `
You are Ollive AI, a modern helpful AI assistant.

You can:
- answer coding questions
- solve math problems
- explain concepts
- generate code
- help with debugging
- answer general questions

Always give clean and clear responses.
`,

      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Streaming failed",
      },
      {
        status: 500,
      },
    );
  }
}
