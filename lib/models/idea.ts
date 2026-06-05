import mongoose, { Schema, Document, Model } from "mongoose"

export interface IIdea extends Document {
  userId: string
  workspaceId: mongoose.Types.ObjectId | null
  title: string
  content: string
  platform: string
  media: string | null
  status: "idea" | "draft" | "ready" | "published"
  createdAt: Date
  updatedAt: Date
}

const IdeaSchema = new Schema<IIdea>(
  {
    userId: { type: String, required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", default: null, index: true },
    title: { type: String, required: true },
    content: { type: String, default: "" },
    platform: { type: String, default: "facebook" },
    media: { type: String, default: null },
    status: {
      type: String,
      enum: ["idea", "draft", "ready", "published"],
      default: "idea",
      index: true,
    },
  },
  { timestamps: true }
)

if (mongoose.models && mongoose.models.Idea) {
  delete (mongoose.models as any).Idea
}

export const Idea: Model<IIdea> =
  mongoose.models.Idea ?? mongoose.model<IIdea>("Idea", IdeaSchema)
