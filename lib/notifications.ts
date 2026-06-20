import { connectDB } from "./db"
import { Notification, UserNotification } from "./models/notification"
import { User } from "./models/user"
import { Workspace } from "./models/workspace"
import { WorkspaceMember } from "./models/workspace-member"
import { notificationEmitter } from "./notification-emitter"

export interface SendNotificationParams {
  title: string
  message: string
  audience: "FREE" | "PRO" | "AGENCY" | "ALL" | "USER" | string
  type?: "success" | "error" | "info" | "BANNER" | "CRITICAL" | string
  createdBy?: string
  userId?: string // Required only if audience is "USER"
}

export async function sendNotification({
  title,
  message,
  audience,
  type = "info",
  createdBy = "SYSTEM",
  userId,
}: SendNotificationParams) {
  await connectDB()

  // 1. Create the template/broadcast Notification record
  const notification = await Notification.create({
    title,
    message,
    audience,
    type,
    createdBy,
    isActive: true,
  })

  // 2. Resolve recipient email addresses
  let targetEmails: string[] = []

  if (audience === "ALL") {
    // Target all active users
    const allUsers = await User.find({ status: "ACTIVE" }, "email").lean()
    targetEmails = allUsers.map((u) => u.email.toLowerCase())
  } else if (audience === "FREE" || audience === "PRO" || audience === "AGENCY") {
    // Target users belonging to this specific subscription tier
    const planUsers = await User.find({ plan: audience, status: "ACTIVE" }, "email").lean()
    targetEmails = planUsers.map((u) => u.email.toLowerCase())

    // For PRO and AGENCY tiers, also target active workspace team members
    if (audience === "PRO" || audience === "AGENCY") {
      const ownerEmails = [...targetEmails]
      const activeWorkspaces = await Workspace.find(
        { ownerEmail: { $in: ownerEmails }, status: "ACTIVE" },
        "_id"
      ).lean()
      const workspaceIds = activeWorkspaces.map((w) => w._id)

      const activeMembers = await WorkspaceMember.find(
        { workspaceId: { $in: workspaceIds }, status: "active" },
        "email"
      ).lean()

      const memberEmails = activeMembers.map((m) => m.email.toLowerCase())
      // De-duplicate the combined owner and member list
      targetEmails = Array.from(new Set([...targetEmails, ...memberEmails]))
    }
  } else if (audience === "USER" && userId) {
    let resolvedEmail = userId.toLowerCase()
    if (!resolvedEmail.includes("@")) {
      // If it is a MongoDB user ID (legacy compat), resolve it to their email address
      const userObj = await User.findById(userId).select("email").lean()
      if (userObj && userObj.email) {
        resolvedEmail = userObj.email.toLowerCase()
      }
    }
    targetEmails = [resolvedEmail]
  }

  // 3. Bulk insert UserNotification delivery records
  if (targetEmails.length > 0) {
    const userNotificationsData = targetEmails.map((email) => ({
      userId: email,
      notificationId: notification._id,
      read: false,
      deliveredAt: new Date(),
    }))

    const insertedDocs = await UserNotification.insertMany(userNotificationsData)

    // 4. Stream the notification in real-time to active SSE connections
    insertedDocs.forEach((un) => {
      notificationEmitter.emit("new-notification", {
        userId: un.userId,
        notification: {
          _id: un._id.toString(),
          title,
          message,
          type,
          read: false,
          createdAt: un.deliveredAt,
        },
      })
    })
  }

  return notification
}
