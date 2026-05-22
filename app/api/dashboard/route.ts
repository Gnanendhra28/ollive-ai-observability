import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const conversations = await prisma.conversation.count();

    const messages = await prisma.message.count();

    const logs = await prisma.inferenceLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    const totalTokens = logs.reduce(
      (sum, log) => sum + (log.totalTokens || 0),
      0,
    );

    const averageLatency =
      logs.length > 0
        ? logs.reduce((sum, log) => sum + (log.latencyMs || 0), 0) / logs.length
        : 0;

    return Response.json({
      success: true,

      stats: {
        conversations,
        messages,
        totalTokens,
        averageLatency,
      },

      logs,
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
