import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateChatCompletion } from "@/lib/ai/llm-wrapper";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const messages = body.messages;

    let conversationId = body.conversationId;

    if (!conversationId) {
      const conversation = await prisma.conversation.create({
        data: {
          title: messages[0]?.content.slice(0, 50) || "New Chat",
        },
      });

      conversationId = conversation.id;
    }

    const latestMessage = messages[messages.length - 1];

    await prisma.message.create({
      data: {
        conversationId,
        role: latestMessage.role,
        content: latestMessage.content,
      },
    });

    const response = await generateChatCompletion(messages, conversationId);

    await prisma.message.create({
      data: {
        conversationId,
        role: "assistant",
        content: response.message,
      },
    });

    return Response.json({
      success: true,
      conversationId,
      message: {
        role: "assistant",
        content: response.message,
      },
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Something went wrong",
      },
      {
        status: 500,
      },
    );
  }
}
