import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        messages: true,
      },
    });

    return Response.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
      },
      {
        status: 500,
      },
    );
  }
}
