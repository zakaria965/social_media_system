import mongoose, { Schema, Document, Model } from "mongoose"

export interface INotification extends Document {
  userId: string
  title: string
  message: string
  type: "success" | "error" | "info"
  read: boolean
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["success", "error", "info"], default: "info" },
    read: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now },
  }
)

if (mongoose.models && mongoose.models.Notification) {
  delete (mongoose.models as any).Notification
}

export const Notification: Model<INotification> =
  mongoose.models.Notification ?? mongoose.model<INotification>("Notification", NotificationSchema)
