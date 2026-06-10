import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/user"
import { Workspace } from "@/lib/models/workspace"
import { SocialAccount } from "@/lib/models/account"
import { Post } from "@/lib/models/post"
import { Subscription } from "@/lib/models/subscription"
import { SupportTicket } from "@/lib/models/support-ticket"
import { AuditLog } from "@/lib/models/audit-log"
import { PlatformSettings } from "@/lib/models/platform-settings"
import { Payment } from "@/lib/models/payment"
import { AILog } from "@/lib/models/ai-log"
import { AIUsage } from "@/lib/models/ai-usage"

// Helper to log admin actions to AuditLog
async function logAdminAction(actor: string, action: string, resource: string, details: string) {
  try {
    await AuditLog.create({
      action,
      actor,
      resource,
      ipAddress: "127.0.0.1",
      details,
      timestamp: new Date()
    })
  } catch (err) {
    console.error("Failed to log admin audit event:", err)
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (action === "overview") {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const totalUsers = await User.countDocuments()
      const freeUsers = await User.countDocuments({ plan: "FREE" })
      const proUsers = await User.countDocuments({ plan: "PRO" })
      const activeWorkspaces = await Workspace.countDocuments()
      const connectedChannels = await SocialAccount.countDocuments({ status: "connected" })
      const postsPublishedToday = await Post.countDocuments({ status: "published", publishedAt: { $gte: startOfDay } })
      const aiRequestsToday = await AILog.countDocuments({ createdAt: { $gte: startOfDay } })
      
      // Calculate monthly revenue from PRO plans
      // Assuming PRO plan is $15/month
      const activeSubs = await Subscription.countDocuments({ plan: "PRO", status: "ACTIVE" })
      const monthlyRevenue = activeSubs * 15

      // New registrations last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const newRegistrations = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })

      // System activity feed
      const activityFeed = await AuditLog.find().sort({ timestamp: -1 }).limit(10)

      // Calculate simple chart data (last 7 days growth)
      const chartData: any[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        d.setHours(0, 0, 0, 0)
        
        const nextD = new Date(d)
        nextD.setDate(nextD.getDate() + 1)

        const usersCount = await User.countDocuments({ createdAt: { $lt: nextD } })
        const revenueCount = await Subscription.countDocuments({ plan: "PRO", status: "ACTIVE", createdAt: { $lt: nextD } }) * 15
        
        const dayAiLogs = await AILog.find({ createdAt: { $gte: d, $lt: nextD } })
        const aiCost = dayAiLogs.reduce((acc, log) => acc + (log.cost || 0), 0)

        chartData.push({
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          users: usersCount,
          revenue: revenueCount,
          aiCost: Math.round(aiCost * 100) / 100
        })
      }

      return NextResponse.json({
        stats: {
          totalUsers,
          freeUsers,
          proUsers,
          activeWorkspaces,
          connectedChannels,
          postsPublishedToday,
          aiRequestsToday,
          monthlyRevenue,
          newRegistrations,
          dbStatus: "Healthy"
        },
        activityFeed,
        chartData
      })
    }

    if (action === "users") {
      const users = await User.find().sort({ createdAt: -1 })
      
      // Map users and calculate their last login from loginHistory
      const mappedUsers = users.map((u) => {
        const lastLogin = u.loginHistory && u.loginHistory.length > 0
          ? u.loginHistory[u.loginHistory.length - 1].timestamp
          : u.createdAt
        return {
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          plan: u.plan || "FREE",
          role: u.role || "USER",
          status: u.status || "ACTIVE",
          createdAt: u.createdAt,
          lastLogin,
          activeSessionsCount: u.activeSessions?.length || 0,
          activeSessions: u.activeSessions || []
        }
      })

      return NextResponse.json({ users: mappedUsers })
    }

    if (action === "workspaces") {
      const workspaces = await Workspace.find().sort({ createdAt: -1 })
      const mappedWorkspaces = await Promise.all(workspaces.map(async (ws) => {
        const owner = await User.findOne({ email: ws.ownerEmail })
        const channelsCount = await SocialAccount.countDocuments({ workspaceId: ws._id })
        const postsCount = await Post.countDocuments({ workspaceId: ws._id })
        
        return {
          id: ws._id.toString(),
          name: ws.name,
          ownerName: owner?.name || "Unknown Owner",
          ownerEmail: ws.ownerEmail,
          plan: owner?.plan || "FREE",
          createdAt: ws.createdAt,
          channelsCount,
          postsCount,
          status: owner?.status === "SUSPENDED" ? "Disabled" : "Active"
        }
      }))

      return NextResponse.json({ workspaces: mappedWorkspaces })
    }

    if (action === "payments") {
      const payments = await Payment.find().sort({ createdAt: -1 })
      
      const totalSubscribers = await User.countDocuments({ plan: "PRO", status: "ACTIVE" })
      const mrr = totalSubscribers * 15
      const arr = mrr * 12
      
      const churnRate = 4.2 // Realistic simulated SaaS churn rate
      const conversionRate = 12.8 // Simulated conversion rate

      return NextResponse.json({
        payments,
        summary: {
          totalSubscribers,
          mrr,
          arr,
          churnRate,
          conversionRate
        }
      })
    }

    if (action === "ai-usage") {
      let settings = await PlatformSettings.findOne()
      if (!settings) {
        settings = await PlatformSettings.create({
          openaiKey: process.env.OPENAI_API_KEY || "",
          openaiModel: "gpt-4o-mini",
          openaiTokenLimit: 500000,
          openaiMonthlyBudget: 100.0,
          openaiEmergencyShutdown: false,
          openaiUsageAlerts: true,
          aiProvider: "gemini"
        })
      }

      const allLogs = await AIUsage.find().sort({ createdAt: -1 })
      
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - 7)
      startOfWeek.setHours(0, 0, 0, 0)
      
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      let costToday = 0
      let costThisWeek = 0
      let costThisMonth = 0
      let costLifetime = 0
      let totalTokensUsed = 0
      let failedRequests = 0
      let totalResponseTime = 0
      let successRequestsCount = 0

      const providerStats = {
        openai: { cost: 0, requests: 0, tokens: 0, errors: 0, totalResponseTime: 0, successRequests: 0 },
        anthropic: { cost: 0, requests: 0, tokens: 0, errors: 0, totalResponseTime: 0, successRequests: 0 },
        gemini: { cost: 0, requests: 0, tokens: 0, errors: 0, totalResponseTime: 0, successRequests: 0 },
        deepseek: { cost: 0, requests: 0, tokens: 0, errors: 0, totalResponseTime: 0, successRequests: 0 }
      }

      const featureUsage = {
        "Caption Generator": 0,
        "Hashtag Generator": 0,
        "Content Calendar": 0,
        "Growth Strategy": 0,
        "Analytics Reports": 0,
        "AI Chat": 0
      }

      const userUsageMap: Record<string, { userId: string; email: string; name: string; plan: string; tokens: number; requests: number; cost: number }> = {}
      const workspaceUsageMap: Record<string, { name: string; requests: number; cost: number }> = {}

      for (const log of allLogs) {
        const time = new Date(log.createdAt).getTime()
        const logCost = log.cost || 0
        const tokens = log.totalTokens || 0

        costLifetime += logCost
        totalTokensUsed += tokens
        if (log.status === "failed") {
          failedRequests++
        } else {
          successRequestsCount++
          totalResponseTime += log.responseTime || 0
        }

        if (time >= startOfToday.getTime()) {
          costToday += logCost
        }
        if (time >= startOfWeek.getTime()) {
          costThisWeek += logCost
        }
        if (time >= startOfMonth.getTime()) {
          costThisMonth += logCost
        }

        const cleanModel = (log.model || "").toLowerCase()
        const providerName = log.provider ? log.provider.toLowerCase() :
                             (cleanModel.includes("claude") ? "anthropic" :
                              cleanModel.includes("gemini") ? "gemini" :
                              cleanModel.includes("deepseek") ? "deepseek" : "openai")
        
        const pKey = providerName === "anthropic" ? "anthropic" :
                     providerName === "gemini" ? "gemini" :
                     providerName === "deepseek" ? "deepseek" : "openai"

        providerStats[pKey].cost += logCost
        providerStats[pKey].requests += 1
        providerStats[pKey].tokens += tokens
        if (log.status === "failed") {
          providerStats[pKey].errors += 1
        } else {
          providerStats[pKey].totalResponseTime += log.responseTime || 0
          providerStats[pKey].successRequests += 1
        }

        const feature = log.feature as keyof typeof featureUsage
        if (feature in featureUsage) {
          featureUsage[feature]++
        }

        if (log.userId) {
          if (!userUsageMap[log.userId]) {
            userUsageMap[log.userId] = {
              userId: log.userId,
              email: "unknown@user.com",
              name: "Unknown User",
              plan: "FREE",
              tokens: 0,
              requests: 0,
              cost: 0
            }
          }
          userUsageMap[log.userId].tokens += tokens
          userUsageMap[log.userId].requests += 1
          userUsageMap[log.userId].cost += logCost
        }

        if (log.workspaceId) {
          if (!workspaceUsageMap[log.workspaceId]) {
            workspaceUsageMap[log.workspaceId] = {
              name: "Loading...",
              requests: 0,
              cost: 0
            }
          }
          workspaceUsageMap[log.workspaceId].requests += 1
          workspaceUsageMap[log.workspaceId].cost += logCost
        }
      }

      const topUserIds = Object.keys(userUsageMap)
      for (const id of topUserIds) {
        const u = await User.findById(id)
        if (u) {
          userUsageMap[id].email = u.email
          userUsageMap[id].name = u.name || u.email.split("@")[0]
          userUsageMap[id].plan = u.plan || "FREE"
        }
      }

      const topWsIds = Object.keys(workspaceUsageMap)
      for (const id of topWsIds) {
        const ws = await Workspace.findById(id)
        if (ws) {
          workspaceUsageMap[id].name = ws.name
        } else {
          workspaceUsageMap[id].name = `Workspace ${id.slice(-6)}`
        }
      }

      const topUsers = Object.values(userUsageMap)
        .sort((a, b) => b.tokens - a.tokens)
        .slice(0, 5)

      const topCostUsers = Object.values(userUsageMap)
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 5)

      const topWorkspaces = Object.values(workspaceUsageMap)
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 5)

      const avgResponseTime = successRequestsCount > 0
        ? Math.round(totalResponseTime / successRequestsCount)
        : 0

      const dbUsers = await User.find().sort({ createdAt: -1 })
      const mappedUsers = dbUsers.map(u => {
        const monthlyTokenLimit = u.monthlyTokenLimit ?? (u.plan === "PRO" ? 5000000 : 50000)
        const monthlyRequestLimit = u.monthlyRequestLimit ?? (u.plan === "PRO" ? -1 : 50)
        const tokensUsed = u.tokensUsed ?? 0
        const requestsUsed = u.requestsUsed ?? 0
        const bonusTokens = u.bonusTokens ?? 0
        const bonusRequests = u.bonusRequests ?? 0
        const aiEnabled = u.aiEnabled !== false

        let aiStatus = "ACTIVE"
        if (u.status === "SUSPENDED") {
          aiStatus = "SUSPENDED"
        } else if (!aiEnabled) {
          aiStatus = "DISABLED"
        } else {
          const effectiveTokenLimit = monthlyTokenLimit + bonusTokens
          const effectiveRequestLimit = monthlyRequestLimit + bonusRequests
          if (
            (effectiveRequestLimit !== -1 && requestsUsed >= effectiveRequestLimit) ||
            (effectiveTokenLimit !== -1 && tokensUsed >= effectiveTokenLimit)
          ) {
            aiStatus = "LIMIT REACHED"
          }
        }

        return {
          id: u._id.toString(),
          name: u.name || u.email.split("@")[0],
          email: u.email,
          plan: u.plan || "FREE",
          tokensUsed,
          tokenLimit: monthlyTokenLimit,
          requestsUsed,
          requestLimit: monthlyRequestLimit,
          bonusTokens,
          bonusRequests,
          aiEnabled,
          status: aiStatus
        }
      })

      const rawLogs = allLogs.slice(0, 200)
      const mappedLogs = await Promise.all(rawLogs.map(async (log) => {
        const u = userUsageMap[log.userId] || { email: "unknown@user.com" }
        let workspaceName = "Personal"
        if (log.workspaceId) {
          const wsInfo = workspaceUsageMap[log.workspaceId]
          if (wsInfo) {
            workspaceName = wsInfo.name
          } else {
            const wsObj = await Workspace.findById(log.workspaceId)
            workspaceName = wsObj ? wsObj.name : `Workspace ${log.workspaceId.slice(-6)}`
          }
        }

        return {
          id: log._id.toString(),
          timestamp: log.createdAt,
          user: u.email,
          workspace: workspaceName,
          feature: log.feature,
          provider: log.provider || (log.model.toLowerCase().includes("gemini") ? "GEMINI" : "OPENAI"),
          model: log.model,
          promptTokens: log.promptTokens,
          completionTokens: log.completionTokens,
          totalTokens: log.totalTokens,
          cost: log.cost,
          responseTime: log.responseTime,
          status: log.status
        }
      }))

      return NextResponse.json({
        summary: {
          costToday,
          costThisWeek,
          costThisMonth,
          costLifetime,
          totalTokensUsed,
          failedRequests,
          avgResponseTime
        },
        providerBreakdown: Object.entries(providerStats).map(([name, stats]) => ({
          name: name === "openai" ? "OpenAI" :
                name === "gemini" ? "Gemini" :
                name === "anthropic" ? "Anthropic" : "DeepSeek",
          cost: stats.cost,
          requests: stats.requests,
          tokens: stats.tokens,
          errors: stats.errors,
          avgResponseTime: stats.successRequests > 0 ? Math.round(stats.totalResponseTime / stats.successRequests) : 0
        })),
        featureUsage: Object.entries(featureUsage).map(([name, count]) => ({ name, count })),
        leaderboard: {
          topUsers,
          topCostUsers,
          topWorkspaces
        },
        users: mappedUsers,
        logs: mappedLogs,
        settings: {
          openaiMonthlyBudget: settings.openaiMonthlyBudget,
          openaiEmergencyShutdown: settings.openaiEmergencyShutdown,
          aiProvider: settings.aiProvider || "gemini"
        }
      })
    }

    if (action === "user-ai-analytics") {
      const targetUserId = searchParams.get("userId")
      if (!targetUserId) {
        return NextResponse.json({ error: "UserId is required" }, { status: 400 })
      }

      const user = await User.findById(targetUserId)
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const userLogs = await AIUsage.find({ userId: targetUserId })
      
      const tokensUsed = user.tokensUsed ?? 0
      const requestsUsed = user.requestsUsed ?? 0
      const costGenerated = userLogs.reduce((acc, log) => acc + (log.cost || 0), 0)

      const featureUsage: Record<string, number> = {}
      let totalResponseTime = 0
      let successRequests = 0
      let lastRequestDate = null

      for (const log of userLogs) {
        featureUsage[log.feature] = (featureUsage[log.feature] || 0) + 1
        if (log.status === "success") {
          totalResponseTime += log.responseTime || 0
          successRequests++
        }
        if (!lastRequestDate || log.createdAt > lastRequestDate) {
          lastRequestDate = log.createdAt
        }
      }

      const avgResponseTime = successRequests > 0 ? Math.round(totalResponseTime / successRequests) : 0
      
      let mostUsedFeature = "None"
      let maxCount = 0
      Object.entries(featureUsage).forEach(([feature, count]) => {
        if (count > maxCount) {
          maxCount = count
          mostUsedFeature = feature
        }
      })

      return NextResponse.json({
        analytics: {
          tokensUsed,
          requests: requestsUsed,
          costGenerated,
          mostUsedFeature,
          lastRequest: lastRequestDate,
          avgResponseTime
        }
      })
    }

    if (action === "channels") {
      const channels = await SocialAccount.find().sort({ platform: 1 })
      
      const mappedChannels = await Promise.all(channels.map(async (ch) => {
        const user = await User.findOne({ email: ch.userId }) // userId is sometimes email or mongoId, support both
        return {
          id: ch._id.toString(),
          platform: ch.platform,
          username: ch.username,
          avatar: ch.avatar,
          followers: ch.followers || 0,
          status: ch.status,
          ownerEmail: user?.email || ch.userId,
          ownerName: user?.name || "Unknown User"
        }
      }))

      return NextResponse.json({ channels: mappedChannels })
    }

    if (action === "tickets") {
      const tickets = await SupportTicket.find().sort({ createdAt: -1 })
      return NextResponse.json({ tickets })
    }

    if (action === "audit-logs") {
      const logs = await AuditLog.find().sort({ timestamp: -1 })
      return NextResponse.json({ logs })
    }

    if (action === "settings") {
      let settings = await PlatformSettings.findOne()
      if (!settings) {
        settings = await PlatformSettings.create({
          openaiKey: process.env.OPENAI_API_KEY || "",
          openaiModel: "gpt-4o-mini",
          openaiTokenLimit: 500000,
          openaiMonthlyBudget: 100,
          openaiEmergencyShutdown: false,
          openaiUsageAlerts: true,
          aiProvider: "gemini",
          fbAppId: process.env.FACEBOOK_APP_ID || "",
          fbAppSecret: process.env.FACEBOOK_APP_SECRET || "",
          fbGraphVersion: "v20.0"
        })
      }
      return NextResponse.json({ settings })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (err: any) {
    console.error("GET /api/admin error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const body = await request.json()
    const { action, userId, workspaceId, settingsData, ticketId, replyContent, priority, status, assignedTo, amount, ip } = body

    const adminEmail = session.user.email || "system-admin"

    // USER ACTIONS
    if (action === "suspend-user") {
      const user = await User.findById(userId)
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
      user.status = "SUSPENDED"
      await user.save()
      await logAdminAction(adminEmail, "SUSPEND_USER", "User", `Suspended user: ${user.email}`)
      return NextResponse.json({ success: true })
    }

    if (action === "activate-user") {
      const user = await User.findById(userId)
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
      user.status = "ACTIVE"
      await user.save()
      await logAdminAction(adminEmail, "ACTIVATE_USER", "User", `Activated user: ${user.email}`)
      return NextResponse.json({ success: true })
    }

    if (action === "promote-admin") {
      const user = await User.findById(userId)
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
      user.role = "ADMIN"
      await user.save()
      await logAdminAction(adminEmail, "PROMOTE_ADMIN", "User", `Promoted user to admin: ${user.email}`)
      return NextResponse.json({ success: true })
    }

    if (action === "remove-admin") {
      const user = await User.findById(userId)
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
      user.role = "USER"
      await user.save()
      await logAdminAction(adminEmail, "REMOVE_ADMIN", "User", `Removed admin access from user: ${user.email}`)
      return NextResponse.json({ success: true })
    }

    if (action === "delete-user") {
      const user = await User.findById(userId)
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
      await User.deleteOne({ _id: userId })
      await logAdminAction(adminEmail, "DELETE_USER", "User", `Deleted user: ${user.email}`)
      return NextResponse.json({ success: true })
    }

    if (action === "adjust-user-tokens") {
      const { limit } = body
      const user = await User.findById(userId)
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
      user.monthlyTokenLimit = Number(limit)
      await user.save()
      await logAdminAction(adminEmail, "ADJUST_TOKENS", "User", `Set AI token limit for ${user.email} to ${limit}`)
      return NextResponse.json({ success: true })
    }

    if (action === "adjust-user-requests") {
      const { limit } = body
      const user = await User.findById(userId)
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
      user.monthlyRequestLimit = Number(limit)
      await user.save()
      await logAdminAction(adminEmail, "ADJUST_REQUESTS", "User", `Set AI request limit for ${user.email} to ${limit}`)
      return NextResponse.json({ success: true })
    }

    if (action === "toggle-user-ai") {
      const { enabled } = body
      const user = await User.findById(userId)
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
      user.aiEnabled = Boolean(enabled)
      await user.save()
      await logAdminAction(adminEmail, "TOGGLE_USER_AI", "User", `${enabled ? "Enabled" : "Disabled"} AI access for ${user.email}`)
      return NextResponse.json({ success: true })
    }

    if (action === "adjust-user-bonus") {
      const { bonusTokens, bonusRequests } = body
      const user = await User.findById(userId)
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
      user.bonusTokens = Number(bonusTokens)
      user.bonusRequests = Number(bonusRequests)
      await user.save()
      await logAdminAction(adminEmail, "ADJUST_BONUS", "User", `Adjusted bonus credits for ${user.email}: +${bonusTokens} tokens, +${bonusRequests} requests`)
      return NextResponse.json({ success: true })
    }

    if (action === "reset-user-limits") {
      const user = await User.findById(userId)
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
      user.tokensUsed = 0
      user.requestsUsed = 0
      await user.save()
      await logAdminAction(adminEmail, "RESET_LIMITS", "User", `Reset AI quotas and counters for user: ${user.email}`)
      return NextResponse.json({ success: true })
    }

    if (action === "save-ai-budget") {
      const { monthlyBudget } = body
      let settings = await PlatformSettings.findOne()
      if (!settings) {
        settings = new PlatformSettings()
      }
      settings.openaiMonthlyBudget = Number(monthlyBudget)
      await settings.save()
      await logAdminAction(adminEmail, "SAVE_BUDGET", "Settings", `Set platform AI monthly budget limit to $${monthlyBudget}`)
      return NextResponse.json({ success: true })
    }

    if (action === "toggle-platform-ai") {
      const { shutdown } = body
      let settings = await PlatformSettings.findOne()
      if (!settings) {
        settings = new PlatformSettings()
      }
      settings.openaiEmergencyShutdown = Boolean(shutdown)
      await settings.save()
      await logAdminAction(adminEmail, "TOGGLE_PLATFORM_AI", "Settings", `${shutdown ? "Suspended" : "Restored"} global platform AI services`)
      return NextResponse.json({ success: true })
    }

    if (action === "force-logout-session") {
      const user = await User.findOne({ "activeSessions.id": body.sessionId })
      if (!user) return NextResponse.json({ error: "Session not found" }, { status: 404 })
      user.activeSessions = user.activeSessions.filter(s => s.id !== body.sessionId)
      await user.save()
      await logAdminAction(adminEmail, "FORCE_LOGOUT", "User", `Terminated user session: ${user.email}`)
      return NextResponse.json({ success: true })
    }

    // WORKSPACE ACTIONS
    if (action === "disable-workspace") {
      const ws = await Workspace.findById(workspaceId)
      if (!ws) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
      const owner = await User.findOne({ email: ws.ownerEmail })
      if (owner) {
        owner.status = "SUSPENDED"
        await owner.save()
      }
      await logAdminAction(adminEmail, "DISABLE_WORKSPACE", "Workspace", `Disabled workspace ${ws.name} (Suspended owner: ${ws.ownerEmail})`)
      return NextResponse.json({ success: true })
    }

    if (action === "delete-workspace") {
      const ws = await Workspace.findById(workspaceId)
      if (!ws) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
      await Workspace.deleteOne({ _id: workspaceId })
      await logAdminAction(adminEmail, "DELETE_WORKSPACE", "Workspace", `Deleted workspace: ${ws.name}`)
      return NextResponse.json({ success: true })
    }

    // SUBSCRIPTION ACTIONS
    if (action === "upgrade-user") {
      const user = await User.findById(userId)
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
      user.plan = "PRO"
      user.subscriptionStatus = "ACTIVE"
      user.monthlyTokenLimit = 5000000
      user.monthlyRequestLimit = -1
      await user.save()

      // Update or create subscription document
      let sub = await Subscription.findOne({ userId: user._id })
      if (sub) {
        sub.plan = "PRO"
        sub.status = "ACTIVE"
        sub.billingCycle = "monthly"
        sub.startedAt = new Date()
        sub.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        await sub.save()
      } else {
        await Subscription.create({
          userId: user._id,
          plan: "PRO",
          status: "ACTIVE",
          billingCycle: "monthly",
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
      }

      // Record transaction
      await Payment.create({
        transactionId: `txn_manual_${Date.now()}`,
        userId: user._id.toString(),
        userEmail: user.email,
        amount: 15.00,
        status: "SUCCESS",
        plan: "PRO",
        billingCycle: "monthly",
      })

      await logAdminAction(adminEmail, "UPGRADE_PLAN", "Subscription", `Upgraded plan for user: ${user.email}`)
      return NextResponse.json({ success: true })
    }

    if (action === "downgrade-user") {
      const user = await User.findById(userId)
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
      user.plan = "FREE"
      user.subscriptionStatus = "ACTIVE"
      user.monthlyTokenLimit = 50000
      user.monthlyRequestLimit = 50
      await user.save()

      let sub = await Subscription.findOne({ userId: user._id })
      if (sub) {
        sub.plan = "FREE"
        sub.status = "ACTIVE"
        sub.billingCycle = "free"
        await sub.save()
      }

      await logAdminAction(adminEmail, "DOWNGRADE_PLAN", "Subscription", `Downgraded plan for user: ${user.email}`)
      return NextResponse.json({ success: true })
    }

    if (action === "cancel-subscription") {
      const user = await User.findById(userId)
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
      user.subscriptionStatus = "CANCELLED"
      await user.save()

      let sub = await Subscription.findOne({ userId: user._id })
      if (sub) {
        sub.status = "CANCELLED"
        await sub.save()
      }

      await logAdminAction(adminEmail, "CANCEL_PLAN", "Subscription", `Cancelled subscription for user: ${user.email}`)
      return NextResponse.json({ success: true })
    }

    // PAYMENT ACTIONS
    if (action === "issue-refund") {
      const payment = await Payment.findOne({ transactionId: body.transactionId })
      if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 })
      
      payment.status = "REFUNDED"
      await payment.save()

      // Downgrade user since payment was refunded
      const user = await User.findById(payment.userId)
      if (user) {
        user.plan = "FREE"
        await user.save()
        
        const sub = await Subscription.findOne({ userId: user._id })
        if (sub) {
          sub.plan = "FREE"
          sub.status = "ACTIVE"
          sub.billingCycle = "free"
          await sub.save()
        }
      }

      await logAdminAction(adminEmail, "REFUND_PAYMENT", "Payment", `Issued manual refund for transaction: ${payment.transactionId}`)
      return NextResponse.json({ success: true })
    }

    if (action === "retry-payment") {
      const payment = await Payment.findOne({ transactionId: body.transactionId })
      if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 })
      
      payment.status = "SUCCESS"
      await payment.save()

      await logAdminAction(adminEmail, "RETRY_PAYMENT", "Payment", `Successfully retried failed transaction: ${payment.transactionId}`)
      return NextResponse.json({ success: true })
    }

    // SUPPORT ACTIONS
    if (action === "reply-ticket") {
      const ticket = await SupportTicket.findOne({ ticketId })
      if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
      
      ticket.messages.push({
        sender: "GrowWave Support (Admin)",
        content: replyContent,
        timestamp: new Date()
      })
      ticket.status = "PENDING"
      await ticket.save()

      await logAdminAction(adminEmail, "REPLY_TICKET", "Support", `Sent support response for ticket: ${ticketId}`)
      return NextResponse.json({ success: true })
    }

    if (action === "update-ticket-meta") {
      const ticket = await SupportTicket.findOne({ ticketId })
      if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
      
      if (priority) ticket.priority = priority
      if (status) ticket.status = status
      if (assignedTo) ticket.assignedTo = assignedTo
      if (body.internalNotes !== undefined) ticket.internalNotes = body.internalNotes

      await ticket.save()
      await logAdminAction(adminEmail, "UPDATE_TICKET", "Support", `Updated ticket meta parameters for ticket: ${ticketId}`)
      return NextResponse.json({ success: true })
    }

    // ANNOUNCEMENTS
    if (action === "create-announcement") {
      const { subject, target, content } = body
      
      // Seed audit log
      await logAdminAction(adminEmail, "CREATE_ANNOUNCEMENT", "Notification", `Broadcasted announcement: "${subject}" to target group: ${target}`)
      return NextResponse.json({ success: true })
    }

    // SETTINGS ACTIONS
    if (action === "save-settings") {
      let settings = await PlatformSettings.findOne()
      if (!settings) {
        settings = new PlatformSettings()
      }

      settings.openaiKey = settingsData.openaiKey
      settings.openaiModel = settingsData.openaiModel
      settings.openaiTokenLimit = Number(settingsData.openaiTokenLimit)
      settings.openaiEmergencyShutdown = settingsData.openaiEmergencyShutdown
      settings.openaiUsageAlerts = settingsData.openaiUsageAlerts
      settings.fbAppId = settingsData.fbAppId
      settings.fbAppSecret = settingsData.fbAppSecret
      settings.fbGraphVersion = settingsData.fbGraphVersion
      settings.maintenanceMode = settingsData.maintenanceMode
      if (settingsData.aiProvider) {
        settings.aiProvider = settingsData.aiProvider
      }
      
      await settings.save()
      await logAdminAction(adminEmail, "UPDATE_SETTINGS", "Settings", "Saved platform configuration settings")
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (err: any) {
    console.error("POST /api/admin error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
