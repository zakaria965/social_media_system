import mongoose, { Schema, Document, Model } from "mongoose"

export interface IAdminNotification extends Document {
  type: string
  title: string
  message: string
  contactMessageId?: mongoose.Types.ObjectId | string
  read: boolean
  createdAt: Date
}

const AdminNotificationSchema = new Schema<IAdminNotification>(
  {
    type: { type: String, required: true, default: "contact_message" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    contactMessageId: { type: Schema.Types.ObjectId, ref: "ContactMessage", index: true },
    read: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true
  }
)

if (mongoose.models && mongoose.models.AdminNotification) {
  delete (mongoose.models as any).AdminNotification
}

export const AdminNotification: Model<IAdminNotification> =
  mongoose.models.AdminNotification ?? mongoose.model<IAdminNotification>("AdminNotification", AdminNotificationSchema)
