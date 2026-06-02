import mongoose, { Schema, Document, Model } from "mongoose"

export type SocialPlatform = "facebook" | "instagram" | "linkedin" | "twitter" | "tiktok"
export type ConversationType = "message" | "comment" | "mention"
export type ConversationStatus = "unread" | "read" | "replied" | "archived" | "assigned" | "closed"
export type SentimentType = "positive" | "neutral" | "negative"
export type PriorityType = "high" | "medium" | "low"

export interface IConversation extends Document {
  userId: string // GrowWave user email
  accountId: string // Reference to SocialAccount ID or platformAccountId
  platform: SocialPlatform
  username: string // Audience member's handle
  userAvatar: string // Audience member's avatar URL
  type: ConversationType
  status: ConversationStatus
  assignedTo: string // Agent name or department (e.g. Sales, Marketing)
  sentiment: SentimentType
  priority: PriorityType
  priorityReason: string // E.g., "Complaint", "Potential Customer"
  lastMessageText: string
  lastMessageAt: Date
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: String, required: true, index: true },
    accountId: { type: String, required: true, index: true },
    platform: {
      type: String,
      enum: ["facebook", "instagram", "linkedin", "twitter", "tiktok"],
      required: true,
      index: true,
    },
    username: { type: String, required: true, index: true },
    userAvatar: { type: String, default: "" },
    type: {
      type: String,
      enum: ["message", "comment", "mention"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["unread", "read", "replied", "archived", "assigned", "closed"],
      default: "unread",
      index: true,
    },
    assignedTo: { type: String, default: "" },
    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: "neutral",
      index: true,
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
      index: true,
    },
    priorityReason: { type: String, default: "" },
    lastMessageText: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
)

// Clear cache in hot reloading Next.js if needed
if (mongoose.models && mongoose.models.Conversation) {
  delete (mongoose.models as any).Conversation
}

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation ??
  mongoose.model<IConversation>("Conversation", ConversationSchema)
