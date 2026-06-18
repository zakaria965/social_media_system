import mongoose, { Schema, Document, Model } from "mongoose"

export interface IContactMessage extends Document {
  firstName: string
  lastName: string
  email: string
  phone?: string
  subject: string
  message: string
  status: "NEW" | "IN_PROGRESS" | "REPLIED" | "CLOSED"
  createdAt: Date
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["NEW", "IN_PROGRESS", "REPLIED", "CLOSED"],
      default: "NEW",
      index: true
    },
  },
  {
    timestamps: true
  }
)

if (mongoose.models && mongoose.models.ContactMessage) {
  delete (mongoose.models as any).ContactMessage
}

export const ContactMessage: Model<IContactMessage> =
  mongoose.models.ContactMessage ?? mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema)
