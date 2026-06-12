import { connectDB } from "./db"
import { User } from "./models/user"
import { PlatformSettings } from "./models/platform-settings"
import { AIUsage } from "./models/ai-usage"
import { Notification } from "./models/notification"

export interface QuotaCheckResult {
  allowed: boolean
  error?: string
  limitReached?: boolean
}

function firstDayOfNextMonth(): Date {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function checkAIQuota(userId: string): Promise<QuotaCheckResult> {
  await connectDB()

  // 1. Load user
  const user = await User.findById(userId)
  if (!user) {
    return { allowed: false, error: "User record not found." }
  }

  // 2. Check suspended status
  if (user.status === "SUSPENDED") {
    return { allowed: false, error: "Your account has been suspended." }
  }

  // 3. Check user AI enabled status
  if (user.aiEnabled === false) {
    return { allowed: false, error: "AI features have been disabled for your account by an administrator." }
  }

  // 4. Load platform settings
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

  // 5. Check platform emergency shutdown (Kill Switch)
  if (settings.openaiEmergencyShutdown) {
    return { allowed: false, error: "AI services are temporarily disabled by the administrator." }
  }

  // 6. Check Platform Monthly Budget limit
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const allMonthLogs = await AIUsage.find({
    createdAt: { $gte: startOfMonth }
  })
  const globalMonthCost = allMonthLogs.reduce((acc, l) => acc + (l.cost || 0), 0)

  if (globalMonthCost >= settings.openaiMonthlyBudget) {
    return { allowed: false, error: "SaaS AI monthly budget exhausted." }
  }

  // 7. Reset user quota statistics if reset date has passed
  const now = new Date()
  const resetDate = user.resetDate || firstDayOfNextMonth()
  if (now >= resetDate) {
    user.tokensUsed = 0
    if (user.plan === "PRO") {
      user.requestsUsed = 0
    }
    user.resetDate = firstDayOfNextMonth()
    await user.save()
  }

  // Admin and Pro users have unlimited access and bypass user checks
  if (user.role === "ADMIN" || user.plan === "PRO") {
    return { allowed: true }
  }

  // 8. Enforce user quota limits
  const monthlyTokenLimit = user.monthlyTokenLimit ?? ((user.plan as string) === "PRO" ? 5000000 : 50000)
  const monthlyRequestLimit = (user.plan as string) === "PRO" ? -1 : 5

  const effectiveTokenLimit = monthlyTokenLimit + (user.bonusTokens || 0)
  const effectiveRequestLimit = monthlyRequestLimit + (user.bonusRequests || 0)

  const tokensUsed = user.tokensUsed || 0
  const requestsUsed = user.requestsUsed || 0

  if (effectiveRequestLimit !== -1 && requestsUsed >= effectiveRequestLimit) {
    return { allowed: false, error: "You have reached your AI limit.", limitReached: true }
  }

  if (effectiveTokenLimit !== -1 && tokensUsed >= effectiveTokenLimit) {
    return { allowed: false, error: "You have reached your monthly AI limit.", limitReached: true }
  }

  return { allowed: true }
}

export async function recordAIUsage(params: {
  userId: string
  workspaceId: string | null
  feature: string
  provider?: string
  model: string
  promptTokens: number
  completionTokens: number
  responseTime: number
  status: "success" | "failed"
}) {
  await connectDB()
  const { userId, workspaceId, feature, provider, model, promptTokens, completionTokens, responseTime, status } = params

  const totalTokens = promptTokens + completionTokens

  // Calculate real costs based on model parameters
  let cost = 0
  if (status === "success" && totalTokens > 0) {
    const cleanModel = (model || "").toLowerCase()
    if (cleanModel.includes("gpt-4o-mini")) {
      cost = promptTokens * 0.00000015 + completionTokens * 0.00000060
    } else if (cleanModel.includes("gpt-4o") || cleanModel.includes("claude-sonnet")) {
      cost = promptTokens * 0.0000025 + completionTokens * 0.000010
    } else if (cleanModel.includes("gemini")) {
      cost = promptTokens * 0.000000075 + completionTokens * 0.00000030
    } else if (cleanModel.includes("glm")) {
      cost = promptTokens * 0.0000001 + completionTokens * 0.0000003
    } else {
      // General default fallback cost rate
      cost = totalTokens * 0.000002
    }
  }

  // 1. Save usage log
  await AIUsage.create({
    userId,
    workspaceId,
    feature,
    provider: provider || (model.toLowerCase().includes("gemini") ? "GEMINI" : "OPENAI"),
    model: model || "unknown",
    promptTokens,
    completionTokens,
    totalTokens,
    cost,
    responseTime,
    status,
    createdAt: new Date()
  })

  // 2. Increment user counts if request was successful
  if (status === "success") {
    await User.findByIdAndUpdate(userId, {
      $inc: {
        tokensUsed: totalTokens,
        requestsUsed: 1
      }
    })
  }

  // 3. Platform AI Budget Warning & Alert system check
  let settings = await PlatformSettings.findOne()
  if (settings && settings.openaiMonthlyBudget > 0) {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const allMonthLogs = await AIUsage.find({
      createdAt: { $gte: startOfMonth }
    })
    const totalCost = allMonthLogs.reduce((acc, l) => acc + (l.cost || 0), 0)

    // A. 100% Critical Alert threshold
    if (totalCost >= settings.openaiMonthlyBudget) {
      const existingAlert = await Notification.findOne({
        title: "AI Budget Critical Alert",
        createdAt: { $gte: startOfMonth }
      })

      if (!existingAlert) {
        const admins = await User.find({ role: "ADMIN" })
        for (const admin of admins) {
          await Notification.create({
            userId: admin._id.toString(),
            title: "AI Budget Critical Alert",
            message: `Platform monthly AI budget has reached 100% of its limit. Total cost: $${totalCost.toFixed(4)} (Limit: $${settings.openaiMonthlyBudget.toFixed(2)}). All non-admin AI requests are blocked.`,
            type: "error"
          })
        }
      }
    } 
    // B. 80% Warning threshold
    else if (totalCost >= settings.openaiMonthlyBudget * 0.8) {
      const existingWarning = await Notification.findOne({
        title: "AI Budget Warning",
        createdAt: { $gte: startOfMonth }
      })

      if (!existingWarning) {
        const admins = await User.find({ role: "ADMIN" })
        for (const admin of admins) {
          await Notification.create({
            userId: admin._id.toString(),
            title: "AI Budget Warning",
            message: `Platform monthly AI budget has reached 80% of its limit. Total cost: $${totalCost.toFixed(4)} of $${settings.openaiMonthlyBudget.toFixed(2)}.`,
            type: "info"
          })
        }
      }
    }
  }
}
