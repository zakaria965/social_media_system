import mongoose, { Schema, Document, Model } from "mongoose"

export interface IActivityLog extends Document {
  userId: string
  workspaceId: mongoose.Types.ObjectId | null
  action: string
  details: string
  platform: string | null
  status: "success" | "failed" | "info"
  createdAt: Date
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: String, required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", default: null, index: true },
    action: { type: String, required: true },
    details: { type: String, required: true },
    platform: {
      type: String,
      enum: ["facebook", "instagram", "linkedin", "twitter", "tiktok", null],
      default: null,
    },
    status: {
      type: String,
      enum: ["success", "failed", "info"],
      default: "info",
    },
    createdAt: { type: Date, default: Date.now },
  }
)

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog ?? mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema)
