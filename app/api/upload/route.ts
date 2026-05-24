import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";

import Document from "@/models/Document";

import { chunkText } from "@/lib/ai/chunk";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        {
          error: "Missing fields",
        },
        { status: 400 },
      );
    }

    const chunks = chunkText(content);

    const document = await Document.create({
      title,
      content,
      chunks,
    });

    return NextResponse.json({
      success: true,
      document,
      chunkCount: chunks.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Upload failed",
      },
      { status: 500 },
    );
  }
}
