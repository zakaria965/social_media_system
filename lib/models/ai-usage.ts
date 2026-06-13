import mongoose, { Schema, Document, Model } from "mongoose"

export interface IAIUsage extends Omit<Document, "model"> {
  userId: string
  workspaceId: string | null
  feature: string
  provider: string
  model: string
  prompt?: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cost: number
  responseTime: number
  status: "success" | "failed"
  createdAt: Date
}

const AIUsageSchema = new Schema<IAIUsage>(
  {
    userId: { type: String, required: true, index: true },
    workspaceId: { type: String, default: null, index: true },
    feature: { type: String, required: true, index: true },
    provider: { type: String, required: true, default: "OPENAI", index: true },
    model: { type: String, required: true },
    prompt: { type: String },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 }, // in milliseconds
    status: { type: String, enum: ["success", "failed"], default: "success", index: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { collection: "ai_usage_logs" }
)

// Prevent hot-reload re-compilation errors in development environment
if (mongoose.models && mongoose.models.AIUsage) {
  delete (mongoose.models as any).AIUsage
}

export const AIUsage: Model<IAIUsage> =
  mongoose.models.AIUsage ?? mongoose.model<IAIUsage>("AIUsage", AIUsageSchema, "ai_usage_logs")
