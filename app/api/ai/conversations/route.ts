import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { AIConversation } from "@/lib/models/ai-conversation"
import { getActiveWorkspaceId } from "@/lib/workspaces"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const email = session.user.email.toLowerCase().trim()

    await connectDB()
    const workspaceId = await getActiveWorkspaceId(email, request)

    const items = await AIConversation.find({ userId: email, workspaceId })
      .sort({ updatedAt: -1 })
      .lean()

    return NextResponse.json({ conversations: items })
  } catch (err: unknown) {
    console.error("GET /api/ai/conversations error:", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const email = session.user.email.toLowerCase().trim()

    await connectDB()
    const workspaceId = await getActiveWorkspaceId(email, request)

    const body = await request.json()
    const { id, title, messages, pinned, favorite, archived, tags } = body

    if (!id) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 })
    }

    const updatedItem = await AIConversation.findOneAndUpdate(
      { id, userId: email, workspaceId },
      {
        id,
        userId: email,
        workspaceId,
        title: title || "New Conversation",
        messages: messages || [],
        pinned: pinned ?? false,
        favorite: favorite ?? false,
        archived: archived ?? false,
        tags: tags || [],
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({ conversation: updatedItem })
  } catch (err: unknown) {
    console.error("POST /api/ai/conversations error:", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const email = session.user.email.toLowerCase().trim()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 })
    }

    await connectDB()
    const workspaceId = await getActiveWorkspaceId(email, request)

    const item = await AIConversation.findOneAndDelete({ id, userId: email, workspaceId })

    if (!item) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error("DELETE /api/ai/conversations error:", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
