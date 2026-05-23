import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    await connectDB();

    const { userId } = await auth();
    console.log("USER ID:", userId);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await Conversation.find({
      userId,
    }).sort({
      updatedAt: -1,
    });
    console.log("FOUND CONVERSATIONS:", conversations);
    return NextResponse.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to fetch conversations",
      },
      { status: 500 },
    );
  }
}
export async function DELETE(req: Request) {
  try {
    await connectDB();

    const { userId } = await auth();
    console.log("USER ID:", userId);

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
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to delete conversation",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const { userId } = await auth();
    console.log("POST USER:", userId);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    let conversation;

    if (body.id) {
      conversation = await Conversation.findOneAndUpdate(
        {
          _id: body.id,
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
    console.log("SAVED CONVERSATION:", conversation);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to save conversation",
      },
      { status: 500 },
    );
  }
}
