import mongoose, { Schema, Document, Model } from "mongoose"

export interface IAIMessage {
  role: "user" | "assistant"
  content: string
  timestamp: string
  pinnedInsight?: boolean
  errorType?: "QUOTA_EXCEEDED" | "CONFIG_INCOMPLETE" | "SERVICE_UNAVAILABLE"
  model?: "gemini" | "zai" | "openrouter"
}

export interface IAIConversation extends Document {
  id: string
  userId: string
  workspaceId: string
  messages: IAIMessage[]
  title: string
  pinned: boolean
  favorite: boolean
  archived: boolean
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

const AIConversationSchema = new Schema<IAIConversation>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    messages: { type: Schema.Types.Mixed, required: true },
    title: { type: String, default: "New Conversation" },
    pinned: { type: Boolean, default: false },
    favorite: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    tags: { type: [String], default: [] }
  },
  { timestamps: true, collection: "ai_conversations" }
)

if (mongoose.models && mongoose.models.AIConversation) {
  delete (mongoose.models as any).AIConversation
}

export const AIConversation: Model<IAIConversation> =
  mongoose.models.AIConversation ??
  mongoose.model<IAIConversation>("AIConversation", AIConversationSchema)
