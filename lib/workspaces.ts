import mongoose from "mongoose"
import { connectDB } from "./db"
import { Workspace, IWorkspace } from "./models/workspace"
import { WorkspaceMember } from "./models/workspace-member"
import { WorkspaceInvitation } from "./models/workspace-invitation"
import { CustomRole } from "./models/custom-role"
import { ActivityLog } from "./models/activity"
import { Post } from "./models/post"
import { SocialAccount } from "./models/account"
import { Media } from "./models/media"

/**
 * Ensures a user has at least one active workspace (e.g. a Personal Workspace).
 * If they don't belong to any workspace, it creates one and migrates their legacy items.
 */
export async function getOrCreateDefaultWorkspace(userEmail: string, userName?: string) {
  await connectDB()

  // 1. Check if user is already a member of any workspace
  const memberships = await WorkspaceMember.find({
    email: userEmail,
    status: "active",
  }).lean()

  if (memberships.length > 0) {
    // Return all workspaces they are active in
    const workspaceIds = memberships.map((m) => m.workspaceId)
    const workspaces = await Workspace.find({ _id: { $in: workspaceIds } }).sort({ createdAt: 1 }).lean()
    return { workspaces, memberships }
  }

  // 2. No workspaces found. Create a new personal workspace.
  const displayName = userName || userEmail.split("@")[0]
  const workspaceName = `${displayName}'s Workspace`

  const newWorkspace = await Workspace.create({
    name: workspaceName,
    ownerEmail: userEmail,
  })

  // Register the owner
  const newMember = await WorkspaceMember.create({
    workspaceId: newWorkspace._id,
    email: userEmail,
    name: displayName,
    role: "Workspace Owner",
    status: "active",
    joinedAt: new Date(),
    lastActive: new Date(),
  })

  // 3. Migrate legacy database assets with userId === userEmail and workspaceId === null
  const workspaceId = newWorkspace._id
  
  await Promise.all([
    Post.updateMany({ userId: userEmail, workspaceId: null }, { $set: { workspaceId } }),
    SocialAccount.updateMany({ userId: userEmail, workspaceId: null }, { $set: { workspaceId } }),
    Media.updateMany({ userId: userEmail, workspaceId: null }, { $set: { workspaceId } }),
    ActivityLog.updateMany({ userId: userEmail, workspaceId: null }, { $set: { workspaceId } }),
  ])

  // Log workspace creation
  await ActivityLog.create({
    userId: userEmail,
    workspaceId,
    action: "create_workspace",
    details: `Created new workspace "${workspaceName}" and migrated personal data.`,
    status: "success",
  })

  return {
    workspaces: [newWorkspace.toObject()],
    memberships: [newMember.toObject()],
  }
}

/**
 * Checks if a user has a specific permission in a workspace.
 * Map of permissions:
 * - dashboard, posts, scheduling, analytics, ai-assistant, media-library, channels, inbox, team, billing, settings
 */
export async function verifyMemberPermission(
  userEmail: string,
  workspaceId: string | mongoose.Types.ObjectId,
  requiredPermission: string
): Promise<{ allowed: boolean; role?: string; error?: string; member?: any }> {
  await connectDB()

  // 1. Verify workspace is not suspended
  const ws = await Workspace.findById(workspaceId)
  if (ws && ws.status === "SUSPENDED") {
    return { allowed: false, error: "This workspace has been suspended by the platform administrator." }
  }

  const member = await WorkspaceMember.findOne({
    workspaceId,
    email: userEmail,
    status: "active",
  })

  if (!member) {
    return { allowed: false, error: "You are not an active member of this workspace" }
  }

  // Normalize legacy role names
  let role = member.role
  if (role === "owner") role = "Workspace Owner";
  if (role === "admin") role = "Admin";
  if (role === "editor") role = "Content Manager";
  if (role === "viewer") role = "Analyst";

  // Workspace Owner always has full permissions
  if (role === "Workspace Owner") {
    return { allowed: true, role, member }
  }

  // Pre-defined static roles permissions
  const staticPermissions: Record<string, string[]> = {
    "Workspace Owner": [
      "dashboard",
      "posts",
      "scheduling",
      "analytics",
      "ai-assistant",
      "media-library",
      "channels",
      "inbox",
      "team",
      "settings",
      "billing",
    ],
    "Admin": [
      "dashboard",
      "posts",
      "scheduling",
      "analytics",
      "ai-assistant",
      "media-library",
      "channels",
      "inbox",
      "team",
      "settings",
    ],
    "Content Manager": [
      "dashboard",
      "posts",
      "scheduling",
      "analytics",
      "ai-assistant",
      "media-library",
    ],
    "Designer": [
      "dashboard",
      "posts",
      "media-library",
    ],
    "Analyst": [
      "dashboard",
      "analytics",
      "inbox",
    ],
  }

  // Check if static role has permission
  if (staticPermissions[role]) {
    if (staticPermissions[role].includes(requiredPermission)) {
      return { allowed: true, role, member }
    }
  } else {
    // Custom Role: Fetch matrix from database
    const customRole = await CustomRole.findOne({
      workspaceId,
      name: role,
    })

    if (customRole && customRole.permissions.includes(requiredPermission)) {
      return { allowed: true, role: `custom:${role}`, member }
    }
  }

  // Individual override permission check
  if (member.customPermissions && member.customPermissions.includes(requiredPermission)) {
    return { allowed: true, role: `custom_override:${role}`, member }
  }

  return { allowed: false, error: `Forbidden: Insufficient permissions for "${requiredPermission}"` }
}

/**
 * Logs a workspace action in the ActivityLog DB
 */
export async function logWorkspaceActivity(
  workspaceId: string | mongoose.Types.ObjectId,
  userEmail: string,
  action: string,
  details: string,
  platform: string | null = null
) {
  await connectDB()
  return ActivityLog.create({
    userId: userEmail,
    workspaceId,
    action,
    details,
    platform,
    status: "success",
  })
}

/**
 * Aggregates statistics of collaboration in a workspace
 */
export async function getWorkspaceStats(workspaceId: string | mongoose.Types.ObjectId) {
  await connectDB()

  const [
    totalMembers,
    pendingInvites,
    connectedChannels,
    publishedPosts,
    scheduledPosts,
    mediaFiles,
  ] = await Promise.all([
    WorkspaceMember.countDocuments({ workspaceId, status: "active" }),
    WorkspaceInvitation.countDocuments({ workspaceId }),
    SocialAccount.countDocuments({ workspaceId, status: "connected" }),
    Post.countDocuments({ workspaceId, status: "published" }),
    Post.countDocuments({ workspaceId, status: "scheduled" }),
    Media.find({ workspaceId }).lean(),
  ])

  // Storage usage
  const storageUsageBytes = mediaFiles.reduce((sum, f) => sum + (f.size || 0), 0)

  // Workspace owner
  const owner = await WorkspaceMember.findOne({ workspaceId, role: { $in: ["owner", "Workspace Owner"] } }).lean()

  // Collaboration insights
  const approvalsCompleted = await Post.countDocuments({ workspaceId, approvalStatus: "approved" })
  const postsCreated = await Post.countDocuments({ workspaceId })

  // Find most active member
  const activityLogs = await ActivityLog.find({ workspaceId }).lean()
  const memberActivityMap: Record<string, number> = {}
  activityLogs.forEach((log) => {
    memberActivityMap[log.userId] = (memberActivityMap[log.userId] || 0) + 1
  })

  let mostActiveMember = "None"
  let maxActivityCount = 0
  Object.entries(memberActivityMap).forEach(([email, count]) => {
    if (count > maxActivityCount) {
      maxActivityCount = count
      mostActiveMember = email
    }
  })

  // Fetch name of most active member
  if (mostActiveMember !== "None") {
    const mem = await WorkspaceMember.findOne({ workspaceId, email: mostActiveMember }).lean()
    if (mem) {
      mostActiveMember = mem.name || mem.email
    }
  }

  // Calculate generic collaboration score
  const teamDensity = Math.min(100, totalMembers * 20)
  const activityIntensity = Math.min(100, activityLogs.length * 2)
  const approvalFlowRatio = postsCreated > 0 ? Math.min(100, Math.round((approvalsCompleted / postsCreated) * 100)) : 50
  const collaborationScore = Math.round((teamDensity + activityIntensity + approvalFlowRatio) / 3)

  return {
    totalMembers,
    pendingInvites,
    connectedChannels,
    publishedPosts,
    scheduledPosts,
    storageUsageBytes,
    ownerName: owner ? owner.name || owner.email : "Unknown",
    ownerEmail: owner ? owner.email : "",
    mostActiveMember,
    postsCreated,
    approvalsCompleted,
    collaborationScore,
    aiUsageCount: activityLogs.filter((l) => l.action.includes("ai") || l.details.includes("AI")).length,
    averageResponseTimeMins: 18, // Simulated response time for approvals review
  }
}

/**
 * Resolves the active workspace ID for a backend HTTP request using header or cookie.
 */
export async function getActiveWorkspaceId(userEmail: string, request?: any): Promise<string> {
  const { cookies } = await import("next/headers")
  let workspaceId = request?.headers?.get("x-workspace-id")
  if (!workspaceId) {
    try {
      const cookieStore = await cookies()
      workspaceId = cookieStore.get("growwave-active-workspace-id")?.value
    } catch (e) {
      // Cookies not available in some contexts
    }
  }

  if (workspaceId) {
    return workspaceId
  }

  // Fallback to default
  const { workspaces } = await getOrCreateDefaultWorkspace(userEmail)
  return workspaces[0]._id.toString()
}
