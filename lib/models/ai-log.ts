import mongoose, { Schema, Document, Model } from "mongoose"

export interface IAILog extends Document {
  userId: string
  provider: string
  action: string
  tokensUsed: number
  cost: number
  responseTimeMs: number
  status: "success" | "failed"
  createdAt: Date
}

const AILogSchema = new Schema<IAILog>(
  {
    userId: { type: String, required: true, index: true },
    provider: { type: String, required: true, index: true },
    action: { type: String, required: true },
    tokensUsed: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    responseTimeMs: { type: Number, default: 0 },
    status: { type: String, enum: ["success", "failed"], default: "success" },
    createdAt: { type: Date, default: Date.now },
  }
)

if (mongoose.models && mongoose.models.AILog) {
  delete (mongoose.models as any).AILog
}

export const AILog: Model<IAILog> =
  mongoose.models.AILog ?? mongoose.model<IAILog>("AILog", AILogSchema)
