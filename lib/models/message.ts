import mongoose, { Schema, Document, Model } from "mongoose"

export type MessageSenderType = "audience" | "user" | "system"
export type MessageType = "message" | "comment" | "reply" | "mention" | "note" | "activity"

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId | string
  senderType: MessageSenderType
  senderName: string
  senderAvatar: string
  text: string
  timestamp: Date
  type: MessageType
  sentiment?: "positive" | "neutral" | "negative"
  meta?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderType: {
      type: String,
      enum: ["audience", "user", "system"],
      required: true,
      index: true,
    },
    senderName: { type: String, required: true },
    senderAvatar: { type: String, default: "" },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    type: {
      type: String,
      enum: ["message", "comment", "reply", "mention", "note", "activity"],
      required: true,
      index: true,
    },
    sentiment: { type: String, enum: ["positive", "neutral", "negative"], index: true },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

if (mongoose.models && mongoose.models.Message) {
  delete (mongoose.models as any).Message
}

export const Message: Model<IMessage> =
  mongoose.models.Message ??
  mongoose.model<IMessage>("Message", MessageSchema)
