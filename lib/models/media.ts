import mongoose, { Schema, Document, Model } from "mongoose"

export interface IMedia extends Document {
  userId: string
  workspaceId: mongoose.Types.ObjectId | null
  name: string
  url: string
  type: "image" | "video"
  size: number
  createdAt: Date
  updatedAt: Date
}

const MediaSchema = new Schema<IMedia>(
  {
    userId: { type: String, required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", default: null, index: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], required: true },
    size: { type: Number, required: true },
  },
  { timestamps: true }
)

export const Media: Model<IMedia> =
  mongoose.models.Media ?? mongoose.model<IMedia>("Media", MediaSchema)
