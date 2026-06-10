import mongoose, { Schema, Document, Model } from "mongoose"

export interface IAIGeneration extends Document {
  userId: string
  prompt: string
  result: string
  timestamp: Date
}

const AIGenerationSchema = new Schema<IAIGeneration>(
  {
    userId: { type: String, required: true, index: true },
    prompt: { type: String, required: true },
    result: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
  }
)

if (mongoose.models && mongoose.models.AIGeneration) {
  delete (mongoose.models as any).AIGeneration
}

export const AIGeneration: Model<IAIGeneration> =
  mongoose.models.AIGeneration ?? mongoose.model<IAIGeneration>("AIGeneration", AIGenerationSchema)
