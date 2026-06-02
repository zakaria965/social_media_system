import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { SocialAccount } from "@/lib/models/account"
import { Conversation } from "@/lib/models/conversation"
import { Message } from "@/lib/models/message"

// Standard high-quality unsplash avatars for realistic sandbox interactions
const AVATARS = {
  olivia: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
  david: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
  sophia: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
  alex: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
  marcus: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80",
  green: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
  chloe: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
}

// Function to automatically seed realistic conversation threads for a connected account
async function seedAccountConversations(userId: string, accountId: string, platform: string, accountUsername: string) {
  const now = new Date()
  
  if (platform === "facebook") {
    // 1. Olivia Vance - Positive Comment
    const convo1 = await Conversation.create({
      userId,
      accountId,
      platform: "facebook",
      username: "Olivia Vance",
      userAvatar: AVATARS.olivia,
      type: "comment",
      status: "unread",
      assignedTo: "",
      sentiment: "positive",
      priority: "medium",
      priorityReason: "",
      lastMessageText: "This is super cool! Love how clean the charts are. 🚀",
      lastMessageAt: new Date(now.getTime() - 22 * 60 * 1000), // 22 min ago
      tags: ["Dashboard", "UI Feedback"],
    })

    await Message.create([
      {
        conversationId: convo1._id,
        senderType: "audience",
        senderName: "Olivia Vance",
        senderAvatar: AVATARS.olivia,
        text: "Just checked out the new GrowWave interface from your latest post. It looks incredible!",
        timestamp: new Date(now.getTime() - 45 * 60 * 1000),
        type: "comment",
        sentiment: "positive",
      },
      {
        conversationId: convo1._id,
        senderType: "user",
        senderName: accountUsername,
        senderAvatar: "",
        text: "Thank you Olivia! We put a lot of work into the design and metrics structure. What is your favorite chart so far?",
        timestamp: new Date(now.getTime() - 35 * 60 * 1000),
        type: "reply",
      },
      {
        conversationId: convo1._id,
        senderType: "audience",
        senderName: "Olivia Vance",
        senderAvatar: AVATARS.olivia,
        text: "This is super cool! Love how clean the charts are. 🚀 The timeseries distributions are incredibly smooth.",
        timestamp: new Date(now.getTime() - 22 * 60 * 1000),
        type: "comment",
        sentiment: "positive",
      }
    ])

    // 2. David Carter - Enterprise Lead DM
    const convo2 = await Conversation.create({
      userId,
      accountId,
      platform: "facebook",
      username: "David Carter",
      userAvatar: AVATARS.david,
      type: "message",
      status: "unread",
      assignedTo: "Sales",
      sentiment: "positive",
      priority: "high",
      priorityReason: "Potential Customer",
      lastMessageText: "Hi there, we are interested in moving our team of 45 creators to GrowWave. Do you have custom enterprise pricing packages?",
      lastMessageAt: new Date(now.getTime() - 55 * 60 * 1000), // 55 min ago
      tags: ["Enterprise", "Pricing Request"],
    })

    await Message.create([
      {
        conversationId: convo2._id,
        senderType: "audience",
        senderName: "David Carter",
        senderAvatar: AVATARS.david,
        text: "Hi there, we are interested in moving our team of 45 creators to GrowWave. Do you have custom enterprise pricing packages?",
        timestamp: new Date(now.getTime() - 55 * 60 * 1000),
        type: "message",
        sentiment: "positive",
      }
    ])
  }

  if (platform === "instagram") {
    // 1. Sophia Martinez - Support Issue DM
    const convo1 = await Conversation.create({
      userId,
      accountId,
      platform: "instagram",
      username: "sophia_m",
      userAvatar: AVATARS.sophia,
      type: "message",
      status: "unread",
      assignedTo: "Support",
      sentiment: "neutral",
      priority: "high",
      priorityReason: "Support Request",
      lastMessageText: "I need help with my account. The composer screen keeps spinning when I drag images.",
      lastMessageAt: new Date(now.getTime() - 75 * 60 * 1000), // 75 min ago
      tags: ["Bug Report", "Composer"],
    })

    await Message.create([
      {
        conversationId: convo1._id,
        senderType: "audience",
        senderName: "sophia_m",
        senderAvatar: AVATARS.sophia,
        text: "Hi support team, I'm trying to schedule a multi-image carousel post.",
        timestamp: new Date(now.getTime() - 90 * 60 * 1000),
        type: "message",
        sentiment: "neutral",
      },
      {
        conversationId: convo1._id,
        senderType: "user",
        senderName: accountUsername,
        senderAvatar: "",
        text: "Hello Sophia! Thanks for reaching out. We would be happy to help. What file size or formats are the carousels?",
        timestamp: new Date(now.getTime() - 82 * 60 * 1000),
        type: "reply",
      },
      {
        conversationId: convo1._id,
        senderType: "audience",
        senderName: "sophia_m",
        senderAvatar: AVATARS.sophia,
        text: "They are standard PNG files around 2MB each. I need help with my account. The composer screen keeps spinning when I drag images.",
        timestamp: new Date(now.getTime() - 75 * 60 * 1000),
        type: "message",
        sentiment: "neutral",
      }
    ])

    // 2. Alex Thompson - Friendly design comment
    const convo2 = await Conversation.create({
      userId,
      accountId,
      platform: "instagram",
      username: "alex_design_co",
      userAvatar: AVATARS.alex,
      type: "comment",
      status: "read",
      assignedTo: "",
      sentiment: "positive",
      priority: "medium",
      priorityReason: "",
      lastMessageText: "This layout looks stunning! Dark theme is perfect. Which HSL palette are you using?",
      lastMessageAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      tags: ["Design System"],
    })

    await Message.create([
      {
        conversationId: convo2._id,
        senderType: "audience",
        senderName: "alex_design_co",
        senderAvatar: AVATARS.alex,
        text: "This layout looks stunning! Dark theme is perfect. Which HSL palette are you using?",
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        type: "comment",
        sentiment: "positive",
      }
    ])
  }

  if (platform === "twitter") {
    // 1. Marcus Aurelius - Complaint Mention
    const convo1 = await Conversation.create({
      userId,
      accountId,
      platform: "twitter",
      username: "marcus_dev",
      userAvatar: AVATARS.marcus,
      type: "mention",
      status: "unread",
      assignedTo: "Support",
      sentiment: "negative",
      priority: "high",
      priorityReason: "Complaint",
      lastMessageText: "Honestly, your service is terrible. The scheduled post didn't publish at my exact time.",
      lastMessageAt: new Date(now.getTime() - 15 * 60 * 1000), // 15 min ago
      tags: ["Scheduler", "System Performance"],
    })

    await Message.create([
      {
        conversationId: convo1._id,
        senderType: "audience",
        senderName: "marcus_dev",
        senderAvatar: AVATARS.marcus,
        text: "Honestly, your service is terrible. The scheduled post didn't publish at my exact time.",
        timestamp: new Date(now.getTime() - 15 * 60 * 1000),
        type: "mention",
        sentiment: "negative",
      }
    ])
  }

  if (platform === "linkedin") {
    // 1. Dr. Rachel Green - Thoughtful Comment
    const convo1 = await Conversation.create({
      userId,
      accountId,
      platform: "linkedin",
      username: "Dr. Rachel Green",
      userAvatar: AVATARS.green,
      type: "comment",
      status: "replied",
      assignedTo: "",
      sentiment: "positive",
      priority: "medium",
      priorityReason: "",
      lastMessageText: "Thank you, Dr. Green! Cohesive design is indeed our core philosophy.",
      lastMessageAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
      tags: ["SaaS Design", "Thought Leadership"],
    })

    await Message.create([
      {
        conversationId: convo1._id,
        senderType: "audience",
        senderName: "Dr. Rachel Green",
        senderAvatar: AVATARS.green,
        text: "Excellent article on SaaS aesthetics. A cohesive design system is indeed the core differentiator in user retention.",
        timestamp: new Date(now.getTime() - 14 * 60 * 60 * 1000),
        type: "comment",
        sentiment: "positive",
      },
      {
        conversationId: convo1._id,
        senderType: "user",
        senderName: accountUsername,
        senderAvatar: "",
        text: "Thank you, Dr. Green! Cohesive design is indeed our core philosophy.",
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        type: "reply",
      }
    ])
  }

  if (platform === "tiktok") {
    // 1. Chloe Jenkins - Positive Comment
    const convo1 = await Conversation.create({
      userId,
      accountId,
      platform: "tiktok",
      username: "chloe_trends",
      userAvatar: AVATARS.chloe,
      type: "comment",
      status: "unread",
      assignedTo: "",
      sentiment: "positive",
      priority: "medium",
      priorityReason: "",
      lastMessageText: "Wow, this clips editor is so fast! Let's gooo!",
      lastMessageAt: new Date(now.getTime() - 120 * 60 * 1000), // 2 hours ago
      tags: ["Clips Editor", "Product Launch"],
    })

    await Message.create([
      {
        conversationId: convo1._id,
        senderType: "audience",
        senderName: "chloe_trends",
        senderAvatar: AVATARS.chloe,
        text: "Wow, this clips editor is so fast! Let's gooo!",
        timestamp: new Date(now.getTime() - 120 * 60 * 1000),
        type: "comment",
        sentiment: "positive",
      }
    ])
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const email = session.user.email
    await connectDB()

    // 1. Read connected accounts for the user
    const connectedAccounts = await SocialAccount.find({
      userId: email,
      status: "connected",
    }).lean()

    if (connectedAccounts.length > 0) {
      // 2. Audit each connected account. If it has 0 conversations, seed it!
      for (const account of connectedAccounts) {
        const convoCount = await Conversation.countDocuments({
          userId: email,
          accountId: account._id.toString(),
        })

        if (convoCount === 0) {
          await seedAccountConversations(
            email,
            account._id.toString(),
            account.platform,
            account.username
          )
        }
      }
    }

    // 3. Compile filters from URL query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const platform = searchParams.get("platform") || ""
    const sentiment = searchParams.get("sentiment") || ""
    const priority = searchParams.get("priority") || ""
    const type = searchParams.get("type") || ""
    const status = searchParams.get("status") || ""

    const queryFilter: Record<string, any> = { userId: email }

    // Platform boundary: only query accounts that are actively connected!
    if (connectedAccounts.length === 0) {
      // Return empty conversations array if no channels connected
      return NextResponse.json({ conversations: [], connectedPlatforms: [] })
    }

    const connectedAccountIds = connectedAccounts.map((a) => a._id.toString())
    queryFilter.accountId = { $in: connectedAccountIds }

    if (platform) {
      queryFilter.platform = platform
    }
    if (sentiment) {
      queryFilter.sentiment = sentiment
    }
    if (priority) {
      queryFilter.priority = priority
    }
    if (type) {
      queryFilter.type = type
    }
    if (status) {
      if (status === "needs_reply") {
        queryFilter.status = { $in: ["unread", "read", "assigned"] }
      } else {
        queryFilter.status = status
      }
    }

    // Search filter
    if (search) {
      queryFilter.$or = [
        { username: { $regex: search, $options: "i" } },
        { lastMessageText: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ]
    }

    // 4. Fetch the conversations
    const conversations = await Conversation.find(queryFilter)
      .sort({ lastMessageAt: -1 })
      .lean()

    return NextResponse.json({
      conversations,
      connectedPlatforms: connectedAccounts.map((a) => a.platform),
    })
  } catch (err: unknown) {
    console.error("GET /api/inbox/conversations error:", err)
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
    const { accountId, platform, username, userAvatar, type, text, sentiment, priority, priorityReason } = body

    if (!accountId || !platform || !username || !type || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check account ownership
    const account = await SocialAccount.findOne({ _id: accountId, userId: session.user.email })
    if (!account) {
      return NextResponse.json({ error: "Social account not found" }, { status: 404 })
    }

    const conversation = await Conversation.create({
      userId: session.user.email,
      accountId,
      platform,
      username,
      userAvatar: userAvatar || "",
      type,
      status: "unread",
      assignedTo: "",
      sentiment: sentiment || "neutral",
      priority: priority || "medium",
      priorityReason: priorityReason || "",
      lastMessageText: text,
      lastMessageAt: new Date(),
    })

    const message = await Message.create({
      conversationId: conversation._id,
      senderType: "audience",
      senderName: username,
      senderAvatar: userAvatar || "",
      text,
      type,
      sentiment: sentiment || "neutral",
    })

    return NextResponse.json({ conversation, message }, { status: 201 })
  } catch (err: unknown) {
    console.error("POST /api/inbox/conversations error:", err)
    const msg = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
