import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    console.log("GET ROUTE STARTED");

    await connectDB();

    console.log("DB CONNECTED");

    const { userId } = await auth();

    console.log("USER ID:", userId);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await Conversation.find({
      userId,
    });

    console.log("FOUND:", conversations.length);

    return NextResponse.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("FULL GET ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch conversations",
      },
      { status: 500 },
    );
  }
}
export async function POST(req: Request) {
  try {
    await connectDB();

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    let conversation;

    if (body.mongoId) {
      conversation = await Conversation.findOneAndUpdate(
        {
          _id: body.mongoId,
          userId,
        },
        {
          title: body.title,
          messages: body.messages,
          pinned: body.pinned || false,
        },
        {
          new: true,
        },
      );
    } else {
      conversation = await Conversation.create({
        userId,
        title: body.title,
        messages: body.messages,
        pinned: body.pinned || false,
      });
    }

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("POST ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to save conversation",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");

    await Conversation.findOneAndDelete({
      _id: id,
      userId,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to delete conversation",
      },
      { status: 500 },
    );
  }
}
