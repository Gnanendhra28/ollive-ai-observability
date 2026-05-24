import { NextRequest } from "next/server";

import { generateStreamingResponse } from "@/lib/ai/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const stream = await generateStreamingResponse({
      messages: body.messages,
      model: body.model || "llama-3.3-70b-versatile",
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error(error);

    return new Response("Streaming error", {
      status: 500,
    });
  }
}
