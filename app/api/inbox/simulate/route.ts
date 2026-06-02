import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { SocialAccount } from "@/lib/models/account"
import { Conversation } from "@/lib/models/conversation"
import { Message } from "@/lib/models/message"

// Standard names and avatars for simulation
const SIMULATED_USERS = [
  { name: "Liam Miller", handle: "liam_miller", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60" },
  { name: "Ava Jenkins", handle: "ava_trends", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60" },
  { name: "Ethan Hunt", handle: "ethan_hunt_agency", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=60" },
  { name: "Maya Patel", handle: "maya_marketing", avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&auto=format&fit=crop&q=60" },
  { name: "Lucas Vance", handle: "lucas_dev_v", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60" },
]

const SCENARIOS = [
  {
    text: "Your analytics dashboard is beautiful! It saved our agency 5 hours of manual spreadsheet exports this week. 👏",
    type: "comment",
    sentiment: "positive",
    priority: "medium",
    priorityReason: "",
    tags: ["Product Review", "Analytics"],
  },
  {
    text: "I'm having a problem connecting my new TikTok channel. It returns an authentication mismatch error. Can someone help?",
    type: "message",
    sentiment: "neutral",
    priority: "high",
    priorityReason: "Support Request",
    tags: ["Bug", "Connection Mismatch"],
  },
  {
    text: "Wait, this is an absolute joke. I deleted a draft in bulk yesterday but it still got scheduled and posted? Delete this immediately!",
    type: "mention",
    sentiment: "negative",
    priority: "high",
    priorityReason: "Complaint",
    tags: ["Urgent Audit", "Scheduler Bug"],
  },
  {
    text: "Hello! I am a senior director at a fast-growing brand agency. We want to schedule a brief enterprise demo for managing 80 client workspaces.",
    type: "message",
    sentiment: "positive",
    priority: "high",
    priorityReason: "Potential Customer",
    tags: ["Enterprise Lead", "Demo Request"],
  },
  {
    text: "Quick question: Does your bulk scheduler support PDF upload attachments for LinkedIn slide carousels?",
    type: "message",
    sentiment: "neutral",
    priority: "medium",
    priorityReason: "",
    tags: ["Sales Question", "LinkedIn"],
  }
]

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const email = session.user.email
    await connectDB()

    // 1. Fetch connected accounts for this user to bind the interaction
    const connectedAccounts = await SocialAccount.find({
      userId: email,
      status: "connected",
    }).lean()

    if (connectedAccounts.length === 0) {
      return NextResponse.json(
        { error: "No connected accounts found. Please connect a social channel first under Channels." },
        { status: 400 }
      )
    }

    // 2. Read selected platform from body, or pick a random active one
    const body = await request.json().catch(() => ({}))
    let platform = body.platform || ""
    let account: any = null

    if (platform) {
      account = connectedAccounts.find((a) => a.platform === platform)
    }

    if (!account) {
      // Pick a random connected account
      const randIdx = Math.floor(Math.random() * connectedAccounts.length)
      account = connectedAccounts[randIdx]
      platform = account.platform
    }

    // 3. Pick random user and random message scenario
    const user = SIMULATED_USERS[Math.floor(Math.random() * SIMULATED_USERS.length)]
    const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]

    const username = platform === "linkedin" || platform === "facebook" ? user.name : `@${user.handle}`
    const now = new Date()

    // 4. Create conversation
    const conversation = await Conversation.create({
      userId: email,
      accountId: account._id.toString(),
      platform: platform as any,
      username,
      userAvatar: user.avatar,
      type: scenario.type as any,
      status: "unread",
      assignedTo: scenario.priority === "high" ? (scenario.priorityReason === "Complaint" ? "Support" : "Sales") : "",
      sentiment: scenario.sentiment as any,
      priority: scenario.priority as any,
      priorityReason: scenario.priorityReason,
      lastMessageText: scenario.text,
      lastMessageAt: now,
      tags: scenario.tags,
    })

    // 5. Create message timeline log
    const message = await Message.create({
      conversationId: conversation._id,
      senderType: "audience",
      senderName: username,
      senderAvatar: user.avatar,
      text: scenario.text,
      type: scenario.type as any,
      sentiment: scenario.sentiment as any,
      timestamp: now,
    })

    return NextResponse.json({
      success: true,
      conversation,
      message,
    }, { status: 201 })
  } catch (err: unknown) {
    console.error("POST /api/inbox/simulate error:", err)
    const msg = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
