import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/user"
import { Workspace } from "@/lib/models/workspace"
import { WorkspaceMember } from "@/lib/models/workspace-member"
import { WorkspaceSettings } from "@/lib/models/workspace-settings"
import { Post } from "@/lib/models/post"
import { SocialAccount } from "@/lib/models/account"
import { Media } from "@/lib/models/media"
import { ActivityLog } from "@/lib/models/activity"
import { getActiveWorkspaceId } from "@/lib/workspaces"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email.toLowerCase().trim()
    const workspaceId = await getActiveWorkspaceId(email, request)
    const body = await request.json()
    const { action } = body

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    // 1. Export Workspace Data
    if (action === "export-workspace") {
      const [workspace, settings, members, posts, channels] = await Promise.all([
        Workspace.findById(workspaceId).lean(),
        WorkspaceSettings.findOne({ workspaceId }).lean(),
        WorkspaceMember.find({ workspaceId }).lean(),
        Post.find({ workspaceId }).lean(),
        SocialAccount.find({ workspaceId }).lean(),
      ])

      await ActivityLog.create({
        userId: email,
        workspaceId,
        action: "export_workspace_data",
        details: "Exported all workspace data including members, channels, posts, and settings configurations.",
        status: "success",
      })

      return NextResponse.json({
        success: true,
        data: { workspace, settings, members, posts, channels },
      })
    }

    // 2. Export Posts
    if (action === "export-posts") {
      const posts = await Post.find({ workspaceId }).sort({ createdAt: -1 }).lean()

      await ActivityLog.create({
        userId: email,
        workspaceId,
        action: "export_posts",
        details: `Exported ${posts.length} posts from workspace publishing archive.`,
        status: "success",
      })

      return NextResponse.json({ success: true, posts })
    }

    // 3. Export Analytics
    if (action === "export-analytics") {
      const activityLogs = await ActivityLog.find({ workspaceId }).sort({ createdAt: -1 }).lean()

      await ActivityLog.create({
        userId: email,
        workspaceId,
        action: "export_analytics",
        details: "Exported workspace collaboration and publishing activity analytics.",
        status: "success",
      })

      return NextResponse.json({ success: true, activityLogs })
    }

    // 4. Backup Settings
    if (action === "backup-settings") {
      const settings = await WorkspaceSettings.findOne({ workspaceId }).lean()

      await ActivityLog.create({
        userId: email,
        workspaceId,
        action: "backup_settings",
        details: "Created a secure workspace configuration backup.",
        status: "success",
      })

      return NextResponse.json({ success: true, backup: settings })
    }

    // 5. Restore Settings
    if (action === "restore-settings") {
      const { backupData } = body
      if (!backupData) {
        return NextResponse.json({ error: "Backup data is required for restore" }, { status: 400 })
      }

      const settings = await WorkspaceSettings.findOne({ workspaceId })
      if (!settings) {
        return NextResponse.json({ error: "Settings record not found" }, { status: 404 })
      }

      // Restore allowed settings keys
      const restoreKeys = [
        "defaultPublishTime", "autoPublish", "approvalRequired", "draftWorkflow",
        "queuePreferences", "retryFailedPosts", "autoRetryDelay", "aiEnabled",
        "modelSelection", "brandVoice", "contentTone", "hashtagSuggestions",
        "captionSuggestions", "aiLanguage", "emailNotifications", "pushNotifications",
        "publishingAlerts", "failedPostAlerts", "commentAlerts", "mentionAlerts",
        "teamAlerts", "securityAlerts", "analyticsDefaultDateRange", "reportingSchedule",
        "weeklyReports", "monthlyReports", "exportFormat", "analyticsTimezone"
      ]

      restoreKeys.forEach((k) => {
        if (backupData[k] !== undefined) {
          ;(settings as any)[k] = backupData[k]
        }
      })

      await settings.save()

      await ActivityLog.create({
        userId: email,
        workspaceId,
        action: "restore_settings",
        details: "Restored workspace configuration preferences successfully from secure backup.",
        status: "success",
      })

      return NextResponse.json({ success: true, settings })
    }

    // 6. Delete Workspace (Dangerous!)
    if (action === "delete-workspace") {
      const { confirmationText } = body
      if (confirmationText !== "DELETE") {
        return NextResponse.json({ error: "Invalid confirmation word. Type 'DELETE' to confirm." }, { status: 400 })
      }

      const workspace = await Workspace.findById(workspaceId)
      if (!workspace) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
      }

      // Security check: Only owner can delete the workspace
      if (workspace.ownerEmail !== email) {
        return NextResponse.json({ error: "Forbidden: Only the workspace Owner can delete this workspace" }, { status: 403 })
      }

      // Delete all workspace assets
      await Promise.all([
        Workspace.findByIdAndDelete(workspaceId),
        WorkspaceMember.deleteMany({ workspaceId }),
        WorkspaceSettings.deleteOne({ workspaceId }),
        Post.deleteMany({ workspaceId }),
        SocialAccount.deleteMany({ workspaceId }),
        Media.deleteMany({ workspaceId }),
        ActivityLog.deleteMany({ workspaceId }),
      ])

      return NextResponse.json({
        success: true,
        message: "Workspace and all associated assets successfully deleted.",
      })
    }

    // 7. Delete User Account (Dangerous!)
    if (action === "delete-account") {
      const { confirmationText } = body
      if (confirmationText !== "CONFIRM") {
        return NextResponse.json({ error: "Invalid confirmation word. Type 'CONFIRM' to confirm." }, { status: 400 })
      }

      const user = await User.findOne({ email })
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Find all workspaces owned by the user and delete them
      const ownedWorkspaces = await Workspace.find({ ownerEmail: email }).lean()
      const ownedWorkspaceIds = ownedWorkspaces.map((w) => w._id)

      await Promise.all([
        // Delete all owned workspaces and associated resources
        Workspace.deleteMany({ ownerEmail: email }),
        WorkspaceMember.deleteMany({ workspaceId: { $in: ownedWorkspaceIds } }),
        WorkspaceSettings.deleteMany({ workspaceId: { $in: ownedWorkspaceIds } }),
        Post.deleteMany({ workspaceId: { $in: ownedWorkspaceIds } }),
        SocialAccount.deleteMany({ workspaceId: { $in: ownedWorkspaceIds } }),
        Media.deleteMany({ workspaceId: { $in: ownedWorkspaceIds } }),
        ActivityLog.deleteMany({ workspaceId: { $in: ownedWorkspaceIds } }),
        
        // Remove membership records of user from other workspaces
        WorkspaceMember.deleteMany({ email }),
        
        // Delete User document itself
        User.deleteOne({ email }),
      ])

      return NextResponse.json({
        success: true,
        message: "User account and all owned workspace databases successfully deleted.",
      })
    }

    return NextResponse.json({ error: "Invalid action specified" }, { status: 400 })
  } catch (err: any) {
    console.error("POST /api/settings/data error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
