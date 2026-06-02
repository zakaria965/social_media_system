import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { SocialAccount } from "@/lib/models/account"
import { Post } from "@/lib/models/post"
import { SocialActivity } from "@/lib/models/social-activity"

const SIMULATED_AUDIENCE = [
  { name: "Liam Miller", handle: "liam_miller", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60" },
  { name: "Ava Jenkins", handle: "ava_trends", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60" },
  { name: "Ethan Hunt", handle: "ethan_hunt_agency", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=60" },
  { name: "Maya Patel", handle: "maya_marketing", avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&auto=format&fit=crop&q=60" },
  { name: "Lucas Vance", handle: "lucas_dev_v", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60" },
  { name: "Olivia Vance", handle: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80" },
  { name: "David Carter", handle: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80" },
]

// Deterministic generator of realistic activities based on actual published posts
async function seedActivitiesFromPosts(userId: string, connectedAccounts: any[], publishedPosts: any[]) {
  const now = new Date()
  
  for (const post of publishedPosts) {
    for (const platform of post.platforms) {
      // Find connected account matching this platform
      const account = connectedAccounts.find((a) => a.platform === platform)
      if (!account) continue

      const baseTime = post.publishedAt || post.createdAt || now
      const postIdStr = post._id.toString()
      
      // Let's generate a dynamic like, comment, share, or retweet
      // 1. Generate Likes
      const likesCount = Math.min(post.engagement?.likes || 0, 5)
      for (let i = 0; i < likesCount; i++) {
        const user = SIMULATED_AUDIENCE[i % SIMULATED_AUDIENCE.length]
        const actId = `like_${postIdStr}_${platform}_${i}`
        
        // Prevent duplicates
        const existing = await SocialActivity.findOne({ userId, postId: postIdStr, platform, type: "like", profileName: user.name })
        if (!existing) {
          await SocialActivity.create({
            userId,
            accountId: account._id.toString(),
            postId: postIdStr,
            platform,
            type: "like",
            profileName: platform === "linkedin" || platform === "facebook" ? user.name : `@${user.handle || "audience_" + i}`,
            profileAvatar: user.avatar,
            text: "liked your post.",
            timestamp: new Date(new Date(baseTime).getTime() + (i + 1) * 35 * 60 * 1000), // Staggered
            postTitle: post.title || post.content?.slice(0, 30) || "Social Post",
            postContent: post.content,
            sentiment: "neutral",
          })
        }
      }

      // 2. Generate Comments
      const commentsCount = Math.min(post.engagement?.comments || 0, 3)
      const commentTexts = [
        "This is an incredible update! Love the UI dark mode design. 🚀",
        "Excellent article on SaaS aesthetics. A cohesive design system is indeed the differentiator.",
        "Quick question: does your scheduler support multi-image uploads for carousels?",
        "Awesome content, thank you for sharing this guide!",
        "Honestly, your composer screen is so fast. Keep up the good work!"
      ]

      for (let i = 0; i < commentsCount; i++) {
        const user = SIMULATED_AUDIENCE[(i + 2) % SIMULATED_AUDIENCE.length]
        const text = commentTexts[(i + Math.floor(Math.random() * 2)) % commentTexts.length]
        
        const existing = await SocialActivity.findOne({ userId, postId: postIdStr, platform, type: "comment", text })
        if (!existing) {
          // Assess sentiment and priority indicators
          let sentiment: "positive" | "neutral" | "negative" = "positive"
          let isComplaint = false
          let isOpportunity = false
          let faqQuestion = ""

          if (text.includes("question") || text.includes("support") || text.includes("scheduler")) {
            sentiment = "neutral"
            faqQuestion = "Does the scheduler support carousels?"
          }

          await SocialActivity.create({
            userId,
            accountId: account._id.toString(),
            postId: postIdStr,
            platform,
            type: "comment",
            profileName: platform === "linkedin" || platform === "facebook" ? user.name : `@${user.handle || "user_" + i}`,
            profileAvatar: user.avatar,
            text,
            timestamp: new Date(new Date(baseTime).getTime() + (i + 2) * 55 * 60 * 1000),
            postTitle: post.title || post.content?.slice(0, 30) || "Social Post",
            postContent: post.content,
            sentiment,
            isComplaint,
            isOpportunity,
            faqQuestion,
            replies: [],
          })
        }
      }

      // 3. Generate Shares or Retweets
      const sharesCount = Math.min(post.engagement?.shares || 0, 2)
      for (let i = 0; i < sharesCount; i++) {
        const user = SIMULATED_AUDIENCE[(i + 4) % SIMULATED_AUDIENCE.length]
        const type = platform === "twitter" ? "retweet" : "share"
        const text = platform === "twitter" ? "retweeted your post." : "shared your post on their profile."

        const existing = await SocialActivity.findOne({ userId, postId: postIdStr, platform, type, profileName: user.name })
        if (!existing) {
          await SocialActivity.create({
            userId,
            accountId: account._id.toString(),
            postId: postIdStr,
            platform,
            type,
            profileName: platform === "linkedin" || platform === "facebook" ? user.name : `@${user.handle || "sharer_" + i}`,
            profileAvatar: user.avatar,
            text,
            timestamp: new Date(new Date(baseTime).getTime() + (i + 3) * 75 * 60 * 1000),
            postTitle: post.title || post.content?.slice(0, 30) || "Social Post",
            postContent: post.content,
            sentiment: "neutral",
          })
        }
      }
    }
  }

  // 4. Generate profile-level direct mentions / page messages if there are no posts or just general activity
  for (const account of connectedAccounts) {
    const existingMentions = await SocialActivity.countDocuments({ userId, accountId: account._id.toString(), postId: null })
    if (existingMentions === 0) {
      // Create a profile DM / Mention
      if (account.platform === "facebook") {
        await SocialActivity.create({
          userId,
          accountId: account._id.toString(),
          postId: null,
          platform: "facebook",
          type: "message",
          profileName: "David Carter",
          profileAvatar: SIMULATED_AUDIENCE[3].avatar,
          text: "Hi there, we are interested in moving our team of 45 creators to GrowWave. Do you have custom enterprise pricing packages?",
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
          postTitle: "Direct Message",
          sentiment: "positive",
          isOpportunity: true,
        })
      } else if (account.platform === "twitter") {
        await SocialActivity.create({
          userId,
          accountId: account._id.toString(),
          postId: null,
          platform: "twitter",
          type: "mention",
          profileName: "@marcus_dev",
          profileAvatar: SIMULATED_AUDIENCE[2].avatar,
          text: "Honestly, your service is terrible. The scheduled post didn't publish at my exact time.",
          timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
          postTitle: "Profile Mention",
          sentiment: "negative",
          isComplaint: true,
        })
      } else if (account.platform === "linkedin") {
        await SocialActivity.create({
          userId,
          accountId: account._id.toString(),
          postId: null,
          platform: "linkedin",
          type: "mention",
          profileName: "Emily Rodriguez",
          profileAvatar: SIMULATED_AUDIENCE[1].avatar,
          text: "Emily mentioned GrowWave Enterprise in a new industry SaaS post highlighting productivity.",
          timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
          postTitle: "Company Page Mention",
          sentiment: "positive",
        })
      }
    }
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

    // 1. Read connected platforms
    const connectedAccounts = await SocialAccount.find({
      userId: email,
      status: "connected",
    }).lean()

    if (connectedAccounts.length === 0) {
      return NextResponse.json({
        activities: [],
        connectedPlatforms: [],
        metrics: null
      })
    }

    const accountIds = connectedAccounts.map((a) => a._id.toString())

    // 2. Fetch published posts to derive activity
    const publishedPosts = await Post.find({
      userId: email,
      status: "published",
    }).lean()

    // 3. Dynamic Seeding of persistent activities derived from published posts
    const activityCount = await SocialActivity.countDocuments({
      userId: email,
      accountId: { $in: accountIds },
    })

    if (activityCount === 0) {
      await seedActivitiesFromPosts(email, connectedAccounts, publishedPosts)
    }

    // 4. Parse request query parameters
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get("platform") || ""
    const type = searchParams.get("type") || ""
    const dateRange = searchParams.get("dateRange") || "" // today, 7d, 30d
    const search = searchParams.get("search") || ""

    const queryFilter: Record<string, any> = {
      userId: email,
      accountId: { $in: accountIds },
    }

    // Platform Filter
    if (platform && platform !== "all") {
      queryFilter.platform = platform
    }

    // Type Filter mapping
    if (type && type !== "all") {
      if (type === "comments") queryFilter.type = "comment"
      else if (type === "likes") queryFilter.type = "like"
      else if (type === "shares") queryFilter.type = { $in: ["share", "retweet"] }
      else if (type === "mentions") queryFilter.type = "mention"
      else if (type === "messages") queryFilter.type = "message"
      else if (type === "reactions") queryFilter.type = "reaction"
    }

    // Date Range Filter
    if (dateRange && dateRange !== "custom") {
      const now = new Date()
      let limitDate = new Date()
      if (dateRange === "today") {
        limitDate.setHours(0, 0, 0, 0)
      } else if (dateRange === "7d") {
        limitDate.setDate(now.getDate() - 7)
      } else if (dateRange === "30d") {
        limitDate.setDate(now.getDate() - 30)
      }
      queryFilter.timestamp = { $gte: limitDate }
    }

    // Search query
    if (search) {
      queryFilter.$or = [
        { profileName: { $regex: search, $options: "i" } },
        { text: { $regex: search, $options: "i" } },
        { postTitle: { $regex: search, $options: "i" } },
      ]
    }

    // 5. Fetch activities chronologically
    const activities = await SocialActivity.find(queryFilter)
      .sort({ timestamp: -1 })
      .lean()

    // 6. Aggregate Engagement Metrics dynamically for the selected platform dashboard
    const platformFilter = platform && platform !== "all" ? { platform } : {}
    const totalPlatformActQuery: any = {
      userId: email,
      accountId: { $in: accountIds },
      ...platformFilter,
    }
    const totalPlatformAct = await SocialActivity.find(totalPlatformActQuery).lean()

    const comments = totalPlatformAct.filter((a) => a.type === "comment").length
    const likes = totalPlatformAct.filter((a) => a.type === "like").length
    const shares = totalPlatformAct.filter((a) => a.type === "share" || a.type === "retweet").length
    const mentions = totalPlatformAct.filter((a) => a.type === "mention").length
    const messages = totalPlatformAct.filter((a) => a.type === "message").length
    const reactions = totalPlatformAct.filter((a) => a.type === "reaction").length

    // Engagement Rate calculation based on connected accounts baseline followers
    let totalFollowers = 0
    let avgEngagementRate = 3.5 // default baseline

    if (platform && platform !== "all") {
      const targetAcc = connectedAccounts.find((a) => a.platform === platform)
      totalFollowers = targetAcc ? targetAcc.followers : 0
      avgEngagementRate = targetAcc ? targetAcc.engagement : 3.5
    } else {
      totalFollowers = connectedAccounts.reduce((sum, a) => sum + (a.followers || 0), 0)
      avgEngagementRate = parseFloat(
        (connectedAccounts.reduce((sum, a) => sum + (a.engagement || 0), 0) / connectedAccounts.length).toFixed(1)
      )
    }

    // Response Rate: answered comments or messages / total comments or messages
    const responseRequiredAct = totalPlatformAct.filter((a) => a.type === "comment" || a.type === "message")
    const answeredCount = responseRequiredAct.filter((a) => a.replies && a.replies.length > 0).length
    const responseRate = responseRequiredAct.length > 0
      ? Math.round((answeredCount / responseRequiredAct.length) * 100)
      : 100

    const metrics = {
      comments,
      likes,
      shares,
      mentions,
      messages,
      reactions,
      followers: totalFollowers,
      engagementRate: avgEngagementRate,
      responseRate,
      growth: timeframeGrowthLabel(platform),
    }

    return NextResponse.json({
      activities,
      connectedPlatforms: connectedAccounts.map((a) => a.platform),
      metrics,
    })
  } catch (err: unknown) {
    console.error("GET /api/inbox/activity error:", err)
    const msg = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function timeframeGrowthLabel(platform: string): string {
  const growths: Record<string, string> = {
    facebook: "+3.2% this week",
    instagram: "+5.8% this week",
    linkedin: "+4.4% this week",
    twitter: "+2.1% this week",
    tiktok: "+8.4% this week",
    all: "+4.8% this week",
  }
  return growths[platform] || growths.all
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const body = await request.json()
    const { activityId, action } = body

    if (!activityId || !action) {
      return NextResponse.json({ error: "Missing activityId or action" }, { status: 400 })
    }

    const activity = await SocialActivity.findOne({ _id: activityId, userId: session.user.email })
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    if (action === "mark_read") {
      activity.read = true
      await activity.save()
    } else if (action === "toggle_unread") {
      activity.read = !activity.read
      await activity.save()
    } else if (action === "delete") {
      await SocialActivity.findOneAndDelete({ _id: activityId, userId: session.user.email })
      return NextResponse.json({ success: true, deleted: true })
    }

    return NextResponse.json({ success: true, activity })
  } catch (err: unknown) {
    console.error("POST /api/inbox/activity error:", err)
    const msg = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
