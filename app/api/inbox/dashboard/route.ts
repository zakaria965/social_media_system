import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { SocialAccount } from "@/lib/models/account"
import { Conversation } from "@/lib/models/conversation"
import { Message } from "@/lib/models/message"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const email = session.user.email
    await connectDB()

    // Load active accounts first to secure and frame the query context
    const accounts = await SocialAccount.find({ userId: email, status: "connected" }).lean()
    if (accounts.length === 0) {
      return NextResponse.json({
        unreadMessages: 0,
        unreadComments: 0,
        mentionsCount: 0,
        responseRate: 100,
        avgResponseTime: "0 min",
        pendingConversations: 0,
        requiresAttention: 0,
      })
    }

    const accountIds = accounts.map((a) => a._id.toString())
    const accountFilter = { userId: email, accountId: { $in: accountIds } }

    // 1. Unread Messages Count
    const unreadMessages = await Conversation.countDocuments({
      ...accountFilter,
      type: "message",
      status: "unread",
    })

    // 2. Unread Comments Count
    const unreadComments = await Conversation.countDocuments({
      ...accountFilter,
      type: "comment",
      status: "unread",
    })

    // 3. Mentions Count
    const mentionsCount = await Conversation.countDocuments({
      ...accountFilter,
      type: "mention",
    })

    // 4. Pending Conversations
    const pendingConversations = await Conversation.countDocuments({
      ...accountFilter,
      status: { $in: ["unread", "read", "assigned"] },
    })

    // 5. Requires Attention (High Priority or Negative Sentiment, not archived/closed)
    const requiresAttention = await Conversation.countDocuments({
      ...accountFilter,
      $or: [
        { sentiment: "negative" },
        { priority: "high" }
      ],
      status: { $in: ["unread", "read", "assigned"] },
    })

    // 6. Response Rate & Average Response Time Calculation
    const totalConversations = await Conversation.countDocuments(accountFilter)
    const repliedConversations = await Conversation.countDocuments({
      ...accountFilter,
      status: { $in: ["replied", "closed"] }
    })

    const responseRate = totalConversations > 0 
      ? Math.round((repliedConversations / totalConversations) * 100) 
      : 100

    // Average Response Time
    let avgResponseTimeStr = "12 min" // default fallback
    const resolvedConvos = await Conversation.find({
      ...accountFilter,
      status: { $in: ["replied", "closed"] }
    }).select("_id").lean()

    if (resolvedConvos.length > 0) {
      let totalDiffMinutes = 0
      let countedResolved = 0

      for (const convo of resolvedConvos) {
        // Fetch audience first message and user first reply
        const firstAudience = await Message.findOne({
          conversationId: convo._id,
          senderType: "audience"
        }).sort({ timestamp: 1 }).lean()

        const firstUserReply = await Message.findOne({
          conversationId: convo._id,
          senderType: "user",
          type: "reply"
        }).sort({ timestamp: 1 }).lean()

        if (firstAudience && firstUserReply) {
          const diffMs = firstUserReply.timestamp.getTime() - firstAudience.timestamp.getTime()
          const diffMin = Math.round(diffMs / (60 * 1000))
          if (diffMin > 0) {
            totalDiffMinutes += diffMin
            countedResolved++
          }
        }
      }

      if (countedResolved > 0) {
        const avg = Math.round(totalDiffMinutes / countedResolved)
        avgResponseTimeStr = `${avg} min`
      }
    }

    return NextResponse.json({
      unreadMessages,
      unreadComments,
      mentionsCount,
      responseRate,
      avgResponseTime: avgResponseTimeStr,
      pendingConversations,
      requiresAttention,
    })
  } catch (err: unknown) {
    console.error("GET /api/inbox/dashboard error:", err)
    const msg = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
