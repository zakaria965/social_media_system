import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { Conversation } from "@/lib/models/conversation"
import { Message } from "@/lib/models/message"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 })
    }

    await connectDB()

    // Secure check: verify conversation belongs to user
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: session.user.email,
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Get messages chronologically
    const messages = await Message.find({ conversationId })
      .sort({ timestamp: 1 })
      .lean()

    return NextResponse.json({ messages })
  } catch (err: unknown) {
    console.error("GET /api/inbox/messages error:", err)
    const msg = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const body = await request.json()
    const { conversationId, type, text, meta } = body

    if (!conversationId || !type) {
      return NextResponse.json({ error: "Missing conversationId or type" }, { status: 400 })
    }

    // Secure check: verify conversation belongs to user
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: session.user.email,
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    let senderType: "audience" | "user" | "system" = "user"
    let senderName = session.user.name || "Brand Agent"
    let senderAvatar = session.user.image || ""

    if (type === "activity") {
      senderType = "system"
      senderName = "System"
      senderAvatar = ""
    }

    const now = new Date()

    // 1. Create the new message timeline node
    const message = await Message.create({
      conversationId,
      senderType,
      senderName,
      senderAvatar,
      text,
      type,
      timestamp: now,
      meta: meta || {},
    })

    // 2. Perform updates on the parent Conversation based on type
    if (type === "reply") {
      conversation.status = "replied"
      conversation.lastMessageText = text
      conversation.lastMessageAt = now
      await conversation.save()
    } else if (type === "note") {
      // Private notes do not change customer-facing conversation status,
      // but they are saved in the conversation thread and update updatedAt
      await conversation.save()
    } else if (type === "activity") {
      const activeMeta = meta || {}
      
      if (activeMeta.action === "assign") {
        conversation.assignedTo = activeMeta.assignedTo || ""
        conversation.status = "assigned"
      } else if (activeMeta.action === "status_change") {
        conversation.status = activeMeta.status || conversation.status
      }
      
      conversation.lastMessageAt = now
      await conversation.save()
    }

    return NextResponse.json({ message, conversation })
  } catch (err: unknown) {
    console.error("POST /api/inbox/messages error:", err)
    const msg = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
