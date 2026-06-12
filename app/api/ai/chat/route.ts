import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { SocialAccount } from "@/lib/models/account"
import { Post } from "@/lib/models/post"
import { Conversation } from "@/lib/models/conversation"
import { WorkspaceMember } from "@/lib/models/workspace-member"
import { WorkspaceSettings } from "@/lib/models/workspace-settings"
import { ActivityLog } from "@/lib/models/activity"
import { AIConversation } from "@/lib/models/ai-conversation"
import { getActiveWorkspaceId } from "@/lib/workspaces"
import { User } from "@/lib/models/user"
import { checkAIQuota, recordAIUsage } from "@/lib/ai-quota"
import OpenAI from "openai"
import { PlatformSettings } from "@/lib/models/platform-settings"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let email = ""
  let workspaceId: any = null
  let dbUser: any = null
  let providerName = "GEMINI"

  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    email = session.user.email.toLowerCase().trim()

    // 2. Connect DB and resolve active workspace
    await connectDB()
    workspaceId = await getActiveWorkspaceId(email, request)

    // Verify that at least one API key is available based on selected provider
    const platformSettings = await PlatformSettings.findOne()
    const selection = "gemini"

    const openAiApiKey = process.env.OPENAI_API_KEY
    const geminiApiKey = process.env.GEMINI_API_KEY

    const isGeminiEnabled = selection === "gemini" || selection === "auto"
    const hasKey = isGeminiEnabled ? !!geminiApiKey : !!openAiApiKey

    if (!hasKey) {
      const missingKeyName = isGeminiEnabled ? "GEMINI_API_KEY" : "OPENAI_API_KEY"
      console.error(`AI service configuration is incomplete: ${missingKeyName} is not defined`)
      
      // Log failure internally
      try {
        await ActivityLog.create({
          userId: email,
          workspaceId,
          action: "ai_chat_failure",
          details: JSON.stringify({
            error: `AI service configuration is incomplete. ${missingKeyName} is missing.`,
            apiStatus: 400,
            errorCode: "CONFIG_INCOMPLETE",
            timestamp: new Date().toISOString()
          }),
          status: "failed",
        })
      } catch (logErr) {
        console.error("Failed to log AI activity:", logErr)
      }

      return NextResponse.json(
        { errorCode: "CONFIG_INCOMPLETE", error: "AI service configuration is incomplete." },
        { status: 400 }
      )
    }

    // F. AI Settings, Brand Voice & Plan Limit
    let settings = await WorkspaceSettings.findOne({ workspaceId })
    if (!settings) {
      settings = await WorkspaceSettings.create({ workspaceId })
    }

    const brandVoice = settings.brandVoice || "No specific brand voice details provided. Default to professional and structured."
    const contentTone = settings.contentTone || "professional"
    const aiLanguage = settings.aiLanguage || "English (US)"

    // Plan check
    dbUser = await User.findOne({ email })
    if (!dbUser) {
      return NextResponse.json({ error: "User record not found" }, { status: 401 })
    }

    const quotaCheck = await checkAIQuota(dbUser._id.toString())
    if (!quotaCheck.allowed) {
      // Log failure internally
      try {
        await ActivityLog.create({
          userId: email,
          workspaceId,
          action: "ai_chat_failure",
          details: JSON.stringify({
            error: quotaCheck.error || "AI Limit Reached",
            apiStatus: quotaCheck.limitReached ? 429 : 403,
            errorCode: quotaCheck.limitReached ? "QUOTA_EXCEEDED" : "UNAUTHORIZED",
            timestamp: new Date().toISOString()
          }),
          status: "failed",
        })
      } catch (logErr) {
        console.error("Failed to log AI activity:", logErr)
      }

      return NextResponse.json(
        { errorCode: quotaCheck.limitReached ? "QUOTA_EXCEEDED" : "UNAUTHORIZED", error: quotaCheck.error || "Your AI usage limit has been reached." },
        { status: quotaCheck.limitReached ? 429 : 403 }
      )
    }

    // 3. Gather Workspace Context
    // A. Active channels
    const accounts = await SocialAccount.find({ workspaceId }).lean()
    
    // B. Posts stats
    const posts = await Post.find({ workspaceId }).lean()
    const published = posts.filter((p) => p.status === "published")
    const scheduled = posts.filter((p) => p.status === "scheduled")
    const drafts = posts.filter((p) => p.status === "draft")
    const failed = posts.filter((p) => p.status === "failed")

    // C. Analytics calculations (from posts & accounts)
    const calculatePostReach = (p: any) => {
      const likes = p.engagement?.likes || 0
      const comments = p.engagement?.comments || 0
      const shares = p.engagement?.shares || 0
      return Math.round(likes * 12 + comments * 20 + shares * 35 + 150)
    }

    const calculatePostClicks = (p: any) => {
      const likes = p.engagement?.likes || 0
      const shares = p.engagement?.shares || 0
      return Math.round(likes * 0.4 + shares * 1.2 + 8)
    }

    const totalLikes = published.reduce((sum, p) => sum + (p.engagement?.likes || 0), 0)
    const totalComments = published.reduce((sum, p) => sum + (p.engagement?.comments || 0), 0)
    const totalShares = published.reduce((sum, p) => sum + (p.engagement?.shares || 0), 0)
    const totalReach = published.reduce((sum, p) => sum + calculatePostReach(p), 0)
    const totalClicks = published.reduce((sum, p) => sum + calculatePostClicks(p), 0)
    const totalFollowers = accounts.reduce((sum, a) => sum + (a.followers || 0), 0)
    const totalEngagement = totalLikes + totalComments + totalShares
    const avgEngagementRate = published.length > 0 ? parseFloat((totalEngagement / published.length).toFixed(1)) : 0
    const clickThroughRate = totalReach > 0 ? parseFloat(((totalClicks / totalReach) * 100).toFixed(2)) : 0

    // Weekday best time insights
    const daysArr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const dayPerformanceSums: Record<number, { count: number; reachSum: number }> = {}
    const hourPerformanceSums: Record<number, { count: number; reachSum: number }> = {}

    for (let i = 0; i < 7; i++) dayPerformanceSums[i] = { count: 0, reachSum: 0 }
    for (let i = 0; i < 24; i++) hourPerformanceSums[i] = { count: 0, reachSum: 0 }

    published.forEach((p) => {
      if (!p.publishedAt) return
      const date = new Date(p.publishedAt)
      const day = date.getDay()
      const hour = date.getHours()
      const reach = calculatePostReach(p)
      dayPerformanceSums[day].count += 1
      dayPerformanceSums[day].reachSum += reach
      hourPerformanceSums[hour].count += 1
      hourPerformanceSums[hour].reachSum += reach
    })

    let bestDayIdx = 2 // Tuesday fallback
    let bestDayAvg = -1
    Object.entries(dayPerformanceSums).forEach(([dayStr, data]) => {
      const day = parseInt(dayStr)
      const avg = data.count > 0 ? data.reachSum / data.count : 0
      if (avg > bestDayAvg) {
        bestDayAvg = avg
        bestDayIdx = day
      }
    })

    let bestHourIdx = 10 // 10 AM fallback
    let bestHourAvg = -1
    Object.entries(hourPerformanceSums).forEach(([hourStr, data]) => {
      const hour = parseInt(hourStr)
      const avg = data.count > 0 ? data.reachSum / data.count : 0
      if (avg > bestHourAvg) {
        bestHourAvg = avg
        bestHourIdx = hour
      }
    })

    const bestDayLabel = daysArr[bestDayIdx]
    const bestHourLabel = `${bestHourIdx === 0 ? 12 : bestHourIdx > 12 ? bestHourIdx - 12 : bestHourIdx}:00 ${bestHourIdx >= 12 ? "PM" : "AM"}`

    // D. Inbox context
    const conversations = await Conversation.find({ userId: email }).lean()
    const activeAccountIds = accounts.map((a) => a.platformAccountId || a._id.toString())
    const inboxConversations = conversations.filter(
      (c) => activeAccountIds.includes(c.accountId) || c.userId === email
    )
    const unreadConversations = inboxConversations.filter((c) => c.status === "unread").length
    const sentimentCounts = {
      positive: inboxConversations.filter((c) => c.sentiment === "positive").length,
      neutral: inboxConversations.filter((c) => c.sentiment === "neutral").length,
      negative: inboxConversations.filter((c) => c.sentiment === "negative").length,
    }
    const complaints = inboxConversations.filter(
      (c) => c.priorityReason === "Complaint" || c.tags.includes("complaint")
    ).length
    const leads = inboxConversations.filter(
      (c) => c.priorityReason === "Potential Customer" || c.tags.includes("lead")
    ).length

    // E. Team Context
    const members = await WorkspaceMember.find({ workspaceId }).lean()
    const pendingApprovals = posts.filter(
      (p) => p.approvalStatus === "pending_review"
    ).length

    const activityLogs = await ActivityLog.find({ workspaceId }).lean()
    const memberActivityMap: Record<string, number> = {}
    activityLogs.forEach((log) => {
      memberActivityMap[log.userId] = (memberActivityMap[log.userId] || 0) + 1
    })

    let mostActiveMemberEmail = "None"
    let maxActivityCount = 0
    Object.entries(memberActivityMap).forEach(([mEmail, count]) => {
      if (count > maxActivityCount) {
        maxActivityCount = count
        mostActiveMemberEmail = mEmail
      }
    })
    let mostActiveMemberName = "None"
    if (mostActiveMemberEmail !== "None") {
      const activeMember = members.find((m) => m.email === mostActiveMemberEmail)
      mostActiveMemberName = activeMember ? activeMember.name || activeMember.email : mostActiveMemberEmail
    }

    // Parse incoming request parameters
    const body = await request.json()
    const { messages = [], action = "", chatId } = body as {
      messages: { role: "user" | "assistant" | "system"; content: string }[]
      action?: string
      chatId?: string
    }

    const prompt = messages[messages.length - 1]?.content || ""
    console.log("Request received");
    console.log(prompt);

    if (!chatId) {
      return NextResponse.json({ error: "chatId is required" }, { status: 400 })
    }

    // System prompt building
    const systemPrompt = `You are GrowWave's Senior AI Workspace Strategist, Content Manager, Growth Consultant, and Intelligence Copilot.
You have secure access to the actual workspace database records.
Provide authentic, precise recommendations based ONLY on the user's real GrowWave data provided below. Do not output mock, fake, or generic metrics.

=========================================
WORKSPACE DATABASE CONTEXT
=========================================
Connected Channels (${accounts.length}):
${accounts.map((a) => `- ${a.platform.toUpperCase()}: username "${a.username}", followers ${a.followers}, status ${a.status}`).join("\n")}

Post Catalog Metrics:
- Total Published: ${published.length}
- Total Scheduled: ${scheduled.length}
- Total Drafts: ${drafts.length}
- Failed Publishing attempts: ${failed.length}

Aggregated 30-Day Analytics:
- Total Followers: ${totalFollowers.toLocaleString()}
- Total Reach: ${totalReach.toLocaleString()}
- Total Engagement (likes, comments, shares): ${totalEngagement.toLocaleString()} (Likes: ${totalLikes}, Comments: ${totalComments}, Shares: ${totalShares})
- Total Link Clicks: ${totalClicks.toLocaleString()}
- Average Engagement Rate per Post: ${avgEngagementRate}
- Average Click-Through Rate: ${clickThroughRate}%
- Predicted Peak Day: ${bestDayLabel}
- Predicted Peak Time: ${bestHourLabel}

Social Inbox Activity:
- Total Threads: ${inboxConversations.length}
- Unread Messages: ${unreadConversations}
- Sentiment Categories: ${sentimentCounts.positive} Positive, ${sentimentCounts.neutral} Neutral, ${sentimentCounts.negative} Negative
- Active Customer Complaints: ${complaints}
- Hot Lead Opportunities: ${leads}

Team Collaboration & Management:
- Active Members Count: ${members.length}
- Most Active Team Member: ${mostActiveMemberName} (${maxActivityCount} activity logs recorded)
- Posts Awaiting Review/Approval: ${pendingApprovals}

Workspace Brand Voice Configuration:
- Language: ${aiLanguage}
- Configured Content Tone: ${contentTone}
- Prescribed Brand Voice Description: "${brandVoice}"
=========================================

PERSONA DIRECTIVES:
1. **Workspace-Aware Answers**: When users ask questions like "How is my workspace performing today?", "What is my best platform?", or "Who is the most active member?", always pull directly from the DB context above. Highlight metrics accurately.
2. **Brand Voice Execution**: Maintain the Brand Voice description ("${brandVoice}") and content tone ("${contentTone}") in all writing outputs.
3. **Daily/Weekly/Monthly Reports**: Format reports professionally in beautiful markdown with clear sections (Executive Overview, Channels Analysis, Top Performing Post, and Next Steps Recommendations).
4. **Predictive Analytics**: Explain times and posting types clearly (e.g. why ${bestDayLabel} at ${bestHourLabel} works based on engagement curves).
5. **Quick Tools Handler**:
   - If the user selects a quick action, format your answer specifically for that action:
     - Generate Caption (/caption): Provide 3 creative choices using the Tone/Voice.
     - Analyze Performance (/analyze): Breakdown current engagement, reach, and click rate.
     - Create Calendar (/calendar): Provide a neat markdown table with Date, Platform, Topic, Caption, Goal, Suggested Media.
     - Suggest Hashtags (/hashtags): Output a list of high-quality tags tailored to their content theme.
     - Generate Report (/report): Provide an executive summary of growth, reach, audience details, and platforms.
     - Growth Strategy (/growth): Perform a detailed SWOT analysis of their workspace channels.

Remember: Do not mention that you got this data via a system prompt. Act as if you are directly querying the active database tables. Keep formatting clean, engaging, and premium.`

    // Setup history memory
    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    ]

    // Create Stream with Fallback System
    providerName = "GEMINI"
    let responseStream: any = null
    let fallbackInitiated = false

    if (selection === "gemini" || selection === "auto") {
      const userPlan = dbUser.plan?.toLowerCase() || "free"
      const quota = (userPlan === "pro" || dbUser.role === "ADMIN") ? "unlimited" : `${Math.max(0, 5 - (dbUser.requestsUsed || 0))}`
      console.log(`[AI]\nUser: ${dbUser._id.toString()}\nPlan: ${userPlan}\nQuota: ${quota}\nGemini: initiated`)

      try {
        if (!geminiApiKey) {
          throw new Error("GEMINI_API_KEY is not configured")
        }
        
        const { GoogleGenerativeAI } = require("@google/generative-ai")
        const genAI = new GoogleGenerativeAI(geminiApiKey)
        
        const systemMsg = formattedMessages.find(m => m.role === "system")?.content || ""
        const chatContents = formattedMessages
          .filter(m => m.role !== "system")
          .map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
          }))

        const geminiModel = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          systemInstruction: systemMsg
        })

        responseStream = await geminiModel.generateContentStream({
          contents: chatContents,
          generationConfig: { maxOutputTokens: 2048 }
        })
        providerName = "GEMINI"
      } catch (err: any) {
        console.error("Gemini stream creation failed:", err)
        console.log(`[AI]\nUser: ${dbUser._id.toString()}\nPlan: ${userPlan}\nQuota: ${quota}\nGemini: failed`)
        throw err
      }
    } else {
      providerName = "OPENAI"
    }

    if (providerName === "OPENAI") {
      if (!openAiApiKey) {
        throw new Error("AI service configuration is incomplete. OPENAI_API_KEY is missing.")
      }
      const openai = new OpenAI({ apiKey: openAiApiKey })
      try {
        responseStream = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: formattedMessages as any,
          stream: true,
          max_tokens: 2048,
        })
      } catch (err: any) {
        console.error("OpenAI Completions Call Failed:", err)
        
        let errorCode = "SERVICE_UNAVAILABLE"
        let errorMessage = "AI Assistant is temporarily unavailable. Please try again in a few moments."
        let httpStatus = 500

        const errMsgStr = err?.message?.toLowerCase() || ""
        const status = err?.status || err?.statusCode

        if (status === 429 || errMsgStr.includes("429") || errMsgStr.includes("quota") || errMsgStr.includes("limit_exceeded") || err?.code === "insufficient_quota") {
          errorCode = "QUOTA_EXCEEDED"
          errorMessage = "Your AI usage limit has been reached."
          httpStatus = 429
        } else if (status === 401 || errMsgStr.includes("api key") || errMsgStr.includes("auth") || errMsgStr.includes("invalid_api_key")) {
          errorCode = "CONFIG_INCOMPLETE"
          errorMessage = "AI service configuration is incomplete."
          httpStatus = 400
        }

        // Log failure internally
        try {
          await ActivityLog.create({
            userId: email,
            workspaceId,
            action: "ai_chat_failure",
            details: JSON.stringify({
              error: err instanceof Error ? err.message : String(err),
              apiStatus: httpStatus,
              errorCode,
              timestamp: new Date().toISOString()
            }),
            status: "failed",
          })
        } catch (logErr) {
          console.error("Failed to log AI activity failure:", logErr)
        }

        return NextResponse.json({ errorCode, error: errorMessage }, { status: httpStatus })
      }
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let assistantText = ""
        try {
          if (providerName === "GEMINI") {
            for await (const chunk of responseStream.stream) {
              const text = chunk.text() || ""
              if (text) {
                assistantText += text
                controller.enqueue(encoder.encode(text))
              }
            }
            const userPlan = dbUser.plan?.toLowerCase() || "free"
            const quota = (userPlan === "pro" || dbUser.role === "ADMIN") ? "unlimited" : `${Math.max(0, 5 - (dbUser.requestsUsed || 0))}`
            console.log(`[AI]\nUser: ${dbUser._id.toString()}\nPlan: ${userPlan}\nQuota: ${quota}\nGemini: success`)
          } else {
            for await (const chunk of responseStream) {
              const text = chunk.choices[0]?.delta?.content || ""
              if (text) {
                assistantText += text
                controller.enqueue(encoder.encode(text))
              }
            }
          }
          controller.close()

          // Log AI Generation success in background
          try {
            await ActivityLog.create({
              userId: email,
              workspaceId,
              action: "ai_chat",
              details: `Interacted with GrowWave AI Copilot. Action: ${action || "General Chat"}. Provider: ${providerName}${fallbackInitiated ? " (OpenAI Fallback)" : ""}`,
              status: "success",
            })
            
            const promptText = messages.map((m: any) => m.content).join("\n")
            const promptTokens = Math.ceil(promptText.length / 4)
            const completionTokens = Math.ceil(assistantText.length / 4)
            const responseTime = Date.now() - startTime

            let feature = "AI Chat"
            const cleanAction = (action || "").toLowerCase().trim()
            if (cleanAction === "/growth" || cleanAction === "/strategy") {
              feature = "Growth Strategy"
            } else if (cleanAction === "/report") {
              feature = "Analytics Reports"
            } else if (cleanAction === "/calendar") {
              feature = "Content Calendar"
            } else if (cleanAction === "/caption") {
              feature = "Caption Generator"
            } else if (cleanAction === "/hashtags") {
              feature = "Hashtag Generator"
            }

            if (dbUser) {
              await recordAIUsage({
                userId: dbUser._id.toString(),
                workspaceId,
                feature,
                provider: providerName,
                model: providerName === "GEMINI" ? "gemini-2.5-flash" : "gpt-4o-mini",
                promptTokens,
                completionTokens,
                responseTime,
                status: "success"
              })
            }
            
            // Sync conversation directly from backend to avoid client sync loss
            const assistantMsg = {
              role: "assistant",
              content: assistantText,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            }
            const updatedHistory = [...messages, assistantMsg]
            await AIConversation.findOneAndUpdate(
              { id: chatId, userId: email, workspaceId },
              {
                id: chatId,
                userId: email,
                workspaceId,
                messages: updatedHistory,
                updatedAt: new Date()
              },
              { upsert: true }
            )

          } catch (logErr) {
            console.error("Failed to log AI activity on success stream end:", logErr)
          }
        } catch (streamErr) {
          console.error("Error reading response stream:", streamErr)
          controller.error(streamErr)

          const userPlan = dbUser.plan?.toLowerCase() || "free"
          const quota = (userPlan === "pro" || dbUser.role === "ADMIN") ? "unlimited" : `${Math.max(0, 5 - (dbUser.requestsUsed || 0))}`
          console.log(`[AI]\nUser: ${dbUser._id.toString()}\nPlan: ${userPlan}\nQuota: ${quota}\nGemini: failed`)

          // Log failure
          try {
            await ActivityLog.create({
              userId: email,
              workspaceId,
              action: "ai_chat_failure",
              details: JSON.stringify({
                error: streamErr instanceof Error ? streamErr.message : String(streamErr),
                apiStatus: 500,
                errorCode: "SERVICE_UNAVAILABLE",
                timestamp: new Date().toISOString()
              }),
              status: "failed",
            })
          } catch (logErr) {
            console.error("Failed to log AI stream activity failure:", logErr)
          }

          if (dbUser) {
            await recordAIUsage({
              userId: dbUser._id.toString(),
              workspaceId,
              feature: "AI Chat",
              provider: providerName,
              model: providerName === "GEMINI" ? "gemini-2.5-flash" : "gpt-4o-mini",
              promptTokens: 0,
              completionTokens: 0,
              responseTime: Date.now() - startTime,
              status: "failed"
            })
          }
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    })
  } catch (err: unknown) {
    console.error("AI Chat API Route error:", err)
    const msg = err instanceof Error ? err.message : "Internal Server Error"
    
    if (dbUser) {
      const userPlan = dbUser.plan?.toLowerCase() || "free"
      const quota = (userPlan === "pro" || dbUser.role === "ADMIN") ? "unlimited" : `${Math.max(0, 5 - (dbUser.requestsUsed || 0))}`
      console.log(`[AI]\nUser: ${dbUser._id.toString()}\nPlan: ${userPlan}\nQuota: ${quota}\nGemini: failed`)
    }
    
    // Log failure internally
    if (email) {
      try {
        await ActivityLog.create({
          userId: email,
          workspaceId,
          action: "ai_chat_failure",
          details: JSON.stringify({
            error: msg,
            apiStatus: 500,
            errorCode: "SERVICE_UNAVAILABLE",
            timestamp: new Date().toISOString()
          }),
          status: "failed",
        })
      } catch (logErr) {
        console.error("Failed to log AI final activity failure:", logErr)
      }
    }

    if (dbUser) {
      await recordAIUsage({
        userId: dbUser._id.toString(),
        workspaceId,
        feature: "AI Chat",
        provider: providerName,
        model: providerName === "GEMINI" ? "gemini-2.5-flash" : "gpt-4o-mini",
        promptTokens: 0,
        completionTokens: 0,
        responseTime: Date.now() - startTime,
        status: "failed"
      })
    }

    console.error("GEMINI ERROR:", err)

    return NextResponse.json(
      { errorCode: "SERVICE_UNAVAILABLE", error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
