import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";

import Document from "@/models/Document";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const { query } = body;

    if (!query) {
      return NextResponse.json(
        {
          error: "Query required",
        },
        { status: 400 },
      );
    }

    const documents = await Document.find({
      content: {
        $regex: query,
        $options: "i",
      },
    });

    const chunks = documents.flatMap((doc: { chunks: string[] }) => doc.chunks);

    return NextResponse.json({
      success: true,
      results: chunks,
      count: chunks.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Search failed",
      },
      { status: 500 },
    );
  }
}
