import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/user"
import { Workspace } from "@/lib/models/workspace"
import { WorkspaceSettings } from "@/lib/models/workspace-settings"
import { ActivityLog } from "@/lib/models/activity"
import { getActiveWorkspaceId } from "@/lib/workspaces"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email.toLowerCase().trim()

    // 1. Fetch User profile
    let user = await User.findOne({ email })
    if (!user) {
      const parts = email.split("@")[0]
      user = await User.create({
        email,
        name: session.user.name || parts.charAt(0).toUpperCase() + parts.slice(1),
        username: parts,
        avatar: session.user.image || "",
        googleConnected: true,
      })
    }

    // 2. Fetch Active Workspace
    const workspaceId = await getActiveWorkspaceId(email, request)
    const workspace = await Workspace.findById(workspaceId)
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // 3. Fetch or Seed WorkspaceSettings
    let settings = await WorkspaceSettings.findOne({ workspaceId: workspace._id })
    if (!settings) {
      settings = await WorkspaceSettings.create({
        workspaceId: workspace._id,
        invoices: [
          { id: "INV-6298", date: "May 15, 2026", amount: 29, status: "paid" },
          { id: "INV-5810", date: "Apr 15, 2026", amount: 29, status: "paid" },
          { id: "INV-4309", date: "Mar 15, 2026", amount: 29, status: "paid" },
        ],
        paymentMethods: [
          { brand: "visa", last4: "4242", expMonth: 12, expYear: 28, default: true },
        ],
      })
    }

    // Initialize or reset user credits
    const { initializeOrResetUserCredits } = await import("@/lib/ai-quota")
    await initializeOrResetUserCredits(user)

    const userObj = user.toObject()
    const plan = (userObj.plan || "FREE").toUpperCase()

    userObj.aiCredits = user.aiCredits ?? (plan === "PRO" ? 1000 : plan === "AGENCY" ? 5000 : 5)
    userObj.aiUsedCredits = user.aiUsedCredits ?? 0
    userObj.totalTokensUsed = user.totalTokensUsed ?? 0

    return NextResponse.json({
      user: userObj,
      settings,
      workspace,
    })
  } catch (err: any) {
    console.error("GET /api/settings error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email.toLowerCase().trim()
    const body = await request.json()
    const workspaceId = await getActiveWorkspaceId(email, request)

    // 1. Fetch relevant models
    const user = await User.findOne({ email })
    const workspace = await Workspace.findById(workspaceId)
    const settings = await WorkspaceSettings.findOne({ workspaceId })

    if (!user || !workspace || !settings) {
      return NextResponse.json({ error: "Configuration models not initialized" }, { status: 404 })
    }

    const activityLogsToCreate = []

    // 2. Perform updates based on payload groups
    if (body.user) {
      const u = body.user
      const prevTimezone = user.timezone
      const prevLang = user.language

      if (u.name !== undefined) user.name = u.name
      if (u.username !== undefined) user.username = u.username
      if (u.bio !== undefined) user.bio = u.bio
      if (u.avatar !== undefined) user.avatar = u.avatar
      if (u.timezone !== undefined) user.timezone = u.timezone
      if (u.country !== undefined) user.country = u.country
      if (u.language !== undefined) user.language = u.language
      if (u.dateFormat !== undefined) user.dateFormat = u.dateFormat
      if (u.timeFormat !== undefined) user.timeFormat = u.timeFormat
      if (u.theme !== undefined) user.theme = u.theme
      if (u.accentColor !== undefined) user.accentColor = u.accentColor
      if (u.sidebarDensity !== undefined) user.sidebarDensity = u.sidebarDensity
      if (u.animationsEnabled !== undefined) user.animationsEnabled = u.animationsEnabled

      await user.save()

      let details = "Updated personal account profile settings."
      if (u.timezone && u.timezone !== prevTimezone) {
        details += ` Timezone updated to ${u.timezone}.`
      }
      if (u.language && u.language !== prevLang) {
        details += ` Language updated to ${u.language}.`
      }

      activityLogsToCreate.push({
        userId: email,
        workspaceId: workspace._id,
        action: "update_profile",
        details,
        status: "success" as const,
      })
    }

    if (body.workspace) {
      const w = body.workspace
      const prevName = workspace.name

      if (w.name !== undefined && w.name.trim()) workspace.name = w.name.trim()
      // Note: description and visibility can be stored directly on workspace if we extend it,
      // or we can allow setting it dynamically (mongoose schemas support schema-less attributes if they are modified, 
      // but to be safe let's save them on workspace document).
      if (w.description !== undefined) (workspace as any).description = w.description
      if (w.timezone !== undefined) (workspace as any).timezone = w.timezone
      if (w.logo !== undefined) (workspace as any).logo = w.logo
      if (w.visibility !== undefined) (workspace as any).visibility = w.visibility


      await workspace.save()

      activityLogsToCreate.push({
        userId: email,
        workspaceId: workspace._id,
        action: "update_workspace",
        details: `Updated workspace configuration. Name: "${workspace.name}" (was "${prevName}").`,
        status: "success" as const,
      })
    }

    if (body.settings) {
      const s = body.settings
      let loggedAction = "update_settings"
      let loggedDetails = "Updated global workspace preferences."

      // Publishing
      if (s.defaultPublishTime !== undefined) settings.defaultPublishTime = s.defaultPublishTime
      if (s.autoPublish !== undefined) settings.autoPublish = s.autoPublish
      if (s.approvalRequired !== undefined) settings.approvalRequired = s.approvalRequired
      if (s.draftWorkflow !== undefined) settings.draftWorkflow = s.draftWorkflow
      if (s.queuePreferences !== undefined) settings.queuePreferences = s.queuePreferences
      if (s.retryFailedPosts !== undefined) settings.retryFailedPosts = s.retryFailedPosts
      if (s.autoRetryDelay !== undefined) settings.autoRetryDelay = s.autoRetryDelay

      // AI Settings
      if (s.aiEnabled !== undefined) settings.aiEnabled = s.aiEnabled
      if (s.modelSelection !== undefined) {
        settings.modelSelection = s.modelSelection
        loggedAction = "update_ai_config"
        loggedDetails = `AI settings: updated default model to ${s.modelSelection}.`
      }
      if (s.brandVoice !== undefined) {
        settings.brandVoice = s.brandVoice
        loggedAction = "update_ai_config"
        loggedDetails = "AI settings: updated brand voice specification."
      }
      if (s.contentTone !== undefined) settings.contentTone = s.contentTone
      if (s.hashtagSuggestions !== undefined) settings.hashtagSuggestions = s.hashtagSuggestions
      if (s.captionSuggestions !== undefined) settings.captionSuggestions = s.captionSuggestions
      if (s.promptTemplates !== undefined) settings.promptTemplates = s.promptTemplates
      if (s.aiLanguage !== undefined) settings.aiLanguage = s.aiLanguage

      // Notifications
      if (s.emailNotifications !== undefined) settings.emailNotifications = s.emailNotifications
      if (s.pushNotifications !== undefined) settings.pushNotifications = s.pushNotifications
      if (s.publishingAlerts !== undefined) settings.publishingAlerts = s.publishingAlerts
      if (s.failedPostAlerts !== undefined) settings.failedPostAlerts = s.failedPostAlerts
      if (s.commentAlerts !== undefined) settings.commentAlerts = s.commentAlerts
      if (s.mentionAlerts !== undefined) settings.mentionAlerts = s.mentionAlerts
      if (s.teamAlerts !== undefined) settings.teamAlerts = s.teamAlerts
      if (s.securityAlerts !== undefined) settings.securityAlerts = s.securityAlerts

      // Team / Permissions
      if (s.defaultRole !== undefined) settings.defaultRole = s.defaultRole
      if (s.invitePermissions !== undefined) settings.invitePermissions = s.invitePermissions
      if (s.approvalWorkflow !== undefined) settings.approvalWorkflow = s.approvalWorkflow
      if (s.contentReviewRules !== undefined) settings.contentReviewRules = s.contentReviewRules

      // Analytics
      if (s.analyticsDefaultDateRange !== undefined) settings.analyticsDefaultDateRange = s.analyticsDefaultDateRange
      if (s.reportingSchedule !== undefined) settings.reportingSchedule = s.reportingSchedule
      if (s.weeklyReports !== undefined) settings.weeklyReports = s.weeklyReports
      if (s.monthlyReports !== undefined) settings.monthlyReports = s.monthlyReports
      if (s.exportFormat !== undefined) settings.exportFormat = s.exportFormat
      if (s.analyticsTimezone !== undefined) settings.analyticsTimezone = s.analyticsTimezone

      // Integrations
      if (s.webhooks !== undefined) {
        settings.webhooks = s.webhooks
        loggedAction = "update_integrations"
        loggedDetails = "Updated webhook integration configurations."
      }
      if (s.apiKeys !== undefined) {
        settings.apiKeys = s.apiKeys
        loggedAction = "update_integrations"
        loggedDetails = "Modified developer API keys catalog."
      }
      if (s.paymentMethods !== undefined) {
        settings.paymentMethods = s.paymentMethods
        loggedAction = "update_billing"
        loggedDetails = "Updated payment methods configurations."
      }
      if (s.currentPlan !== undefined) {
        const prevPlan = settings.currentPlan
        settings.currentPlan = s.currentPlan
        loggedAction = "update_billing"
        loggedDetails = `Subscription plan changed from ${prevPlan.toUpperCase()} to ${s.currentPlan.toUpperCase()}.`
      }

      await settings.save()

      activityLogsToCreate.push({
        userId: email,
        workspaceId: workspace._id,
        action: loggedAction,
        details: loggedDetails,
        status: "success" as const,
      })
    }

    // Write all accumulated logs
    if (activityLogsToCreate.length > 0) {
      await ActivityLog.insertMany(activityLogsToCreate)
    }

    const userObj = user.toObject()
    const plan = (userObj.plan || "FREE").toUpperCase()
    if (plan === "FREE") {
      const { getTodayAIUsage } = await import("@/lib/ai-quota")
      const todayUsage = await getTodayAIUsage(userObj._id.toString())
      userObj.requestsUsed = todayUsage
      userObj.aiCreditsUsed = todayUsage
    }

    return NextResponse.json({
      success: true,
      user: userObj,
      settings,
      workspace,
    })
  } catch (err: any) {
    console.error("PATCH /api/settings error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
