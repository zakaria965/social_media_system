import mongoose, { Schema, Document, Model } from "mongoose"

export interface IAIConsumption extends Omit<Document, "model"> {
  userId: string
  provider: string
  model: string
  tokensUsed: number
  creditsConsumed: number
  createdAt: Date
}

const AIConsumptionSchema = new Schema<IAIConsumption>(
  {
    userId: { type: String, required: true, index: true },
    provider: { type: String, required: true, index: true },
    model: { type: String, required: true },
    tokensUsed: { type: Number, default: 0 },
    creditsConsumed: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, index: true }
  },
  { collection: "ai_consumption_logs" }
)

if (mongoose.models && mongoose.models.AIConsumption) {
  delete (mongoose.models as any).AIConsumption
}

export const AIConsumption: Model<IAIConsumption> =
  mongoose.models.AIConsumption ?? mongoose.model<IAIConsumption>("AIConsumption", AIConsumptionSchema, "ai_consumption_logs")
