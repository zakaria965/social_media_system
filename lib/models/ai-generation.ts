import mongoose, { Schema, Document, Model } from "mongoose"

export interface IAIGeneration extends Omit<Document, "model"> {
  userId: string
  prompt: string
  response: string
  provider?: string
  model: string
  createdAt: Date
}

const AIGenerationSchema = new Schema<IAIGeneration>(
  {
    userId: { type: String, required: true, index: true },
    prompt: { type: String, required: true },
    response: { type: String, required: true },
    provider: { type: String, index: true },
    model: { type: String, default: "gemini" },
    createdAt: { type: Date, default: Date.now, index: true },
  }
)

if (mongoose.models && mongoose.models.AIGeneration) {
  delete (mongoose.models as any).AIGeneration
}

export const AIGeneration: Model<IAIGeneration> =
  mongoose.models.AIGeneration ?? mongoose.model<IAIGeneration>("AIGeneration", AIGenerationSchema)
