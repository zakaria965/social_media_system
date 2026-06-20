import mongoose, { Schema, Document, Model } from "mongoose"

export interface INotification extends Document {
  title: string
  message: string
  audience: "FREE" | "PRO" | "AGENCY" | "ALL" | "USER" | string
  type: "success" | "error" | "info" | "BANNER" | "CRITICAL" | string
  createdBy: string
  createdAt: Date
  expiresAt?: Date
  isActive: boolean
  userId?: string // Legacy compatibility for direct user alerts
}

export interface IUserNotification extends Document {
  userId: string // recipient's lowercased email address
  notificationId: mongoose.Types.ObjectId | string
  read: boolean
  deliveredAt: Date
  readAt?: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    audience: { type: String, default: "USER", index: true }, // Default to USER for legacy compatibility
    type: { type: String, default: "info" },
    createdBy: { type: String, default: "SYSTEM" }, // Default to SYSTEM for legacy compatibility
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
    userId: { type: String }, // Optional field for user-specific system alerts
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
  }
)

const UserNotificationSchema = new Schema<IUserNotification>(
  {
    userId: { type: String, required: true, index: true },
    notificationId: { type: Schema.Types.ObjectId, ref: "Notification", required: true, index: true },
    read: { type: Boolean, default: false, index: true },
    deliveredAt: { type: Date, default: Date.now, index: true },
    readAt: { type: Date },
  }
)

// Efficient compound indexes for quick unread queries and sorted pagination
UserNotificationSchema.index({ userId: 1, read: 1 })
UserNotificationSchema.index({ userId: 1, deliveredAt: -1 })

// Post-save middleware to handle legacy Notification.create calls automatically
NotificationSchema.post("save", async function (doc: any) {
  try {
    const targetUserId = doc.userId || (doc.audience === "USER" ? doc.createdBy : null)
    if (targetUserId) {
      let resolvedEmail = targetUserId.toLowerCase()
      
      // Resolve email if targetUserId is a MongoDB ID
      if (!resolvedEmail.includes("@")) {
        const UserModel = mongoose.models.User || mongoose.model("User")
        const userObj = await UserModel.findById(targetUserId).select("email").lean()
        if (userObj && (userObj as any).email) {
          resolvedEmail = (userObj as any).email.toLowerCase()
        } else {
          // If user not found, skip creation to avoid orphaned notifications
          return
        }
      }

      // Check if UserNotification already exists to prevent duplicate triggers
      const UserNotificationModel = mongoose.models.UserNotification || mongoose.model("UserNotification")
      const existing = await UserNotificationModel.findOne({
        userId: resolvedEmail,
        notificationId: doc._id
      })

      if (!existing) {
        const un = await UserNotificationModel.create({
          userId: resolvedEmail,
          notificationId: doc._id,
          read: false,
          deliveredAt: new Date()
        })

        // Emit real-time notification push event
        const { notificationEmitter } = require("../notification-emitter")
        notificationEmitter.emit("new-notification", {
          userId: resolvedEmail,
          notification: {
            _id: un._id.toString(),
            title: doc.title,
            message: doc.message,
            type: doc.type || "info",
            read: false,
            createdAt: un.deliveredAt
          }
        })
      }
    }
  } catch (err) {
    console.error("Notification post-save middleware error:", err)
  }
})

if (mongoose.models && mongoose.models.Notification) {
  delete (mongoose.models as any).Notification
}
if (mongoose.models && mongoose.models.UserNotification) {
  delete (mongoose.models as any).UserNotification
}

export const Notification: Model<INotification> =
  mongoose.models.Notification ?? mongoose.model<INotification>("Notification", NotificationSchema)

export const UserNotification: Model<IUserNotification> =
  mongoose.models.UserNotification ?? mongoose.model<IUserNotification>("UserNotification", UserNotificationSchema)
