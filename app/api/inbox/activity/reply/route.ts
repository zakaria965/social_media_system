import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { SocialActivity } from "@/lib/models/social-activity"
import { SocialAccount } from "@/lib/models/account"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const body = await request.json()
    const { activityId, text } = body

    if (!activityId || !text) {
      return NextResponse.json({ error: "Missing activityId or text" }, { status: 400 })
    }

    const activity = await SocialActivity.findOne({
      _id: activityId,
      userId: session.user.email,
    })

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    // Find the connected social account for avatar info
    const account = await SocialAccount.findOne({
      _id: activity.accountId,
      userId: session.user.email,
    })

    const senderName = account ? account.username : (session.user.name || "Brand Account")
    const senderAvatar = account ? account.avatar : (session.user.image || "")

    // Append reply
    const newReply = {
      senderName,
      senderAvatar,
      text,
      timestamp: new Date(),
    }

    activity.replies.push(newReply)
    activity.read = true // Automatically mark as resolved/read when replied to!
    await activity.save()

    return NextResponse.json({
      success: true,
      activity,
      reply: newReply,
    }, { status: 201 })
  } catch (err: unknown) {
    console.error("POST /api/inbox/activity/reply error:", err)
    const msg = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
