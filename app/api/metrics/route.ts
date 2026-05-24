import { NextResponse } from "next/server";

import { metrics } from "@/lib/ai/metrics";

export async function GET() {
  const averageLatency =
    metrics.requests > 0 ? metrics.totalLatency / metrics.requests : 0;

  return NextResponse.json({
    requests: metrics.requests,
    errors: metrics.errors,
    averageLatency,
  });
}
