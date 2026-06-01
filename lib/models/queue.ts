import mongoose, { Schema, Document, Model } from "mongoose"

export interface IQueueLog {
  timestamp: Date
  message: string
  status: string
}

export interface IQueueJob extends Document {
  postId: mongoose.Types.ObjectId
  platform: string
  publishDate: string
  publishTime: string
  retryCount: number
  status: "pending" | "running" | "completed" | "failed" | "retrying"
  runAt: Date
  executionLogs: IQueueLog[]
  createdAt: Date
  updatedAt: Date
}

const QueueJobSchema = new Schema<IQueueJob>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    platform: {
      type: String,
      enum: ["facebook", "instagram", "linkedin", "twitter", "tiktok"],
      required: true,
    },
    publishDate: { type: String, required: true },
    publishTime: { type: String, required: true },
    retryCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed", "retrying"],
      default: "pending",
      index: true,
    },
    runAt: { type: Date, required: true, index: true },
    executionLogs: [
      {
        timestamp: { type: Date, default: Date.now },
        message: { type: String, required: true },
        status: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
)

// Delete compiled model cache to avoid nextjs re-registration issues
if (mongoose.models && mongoose.models.QueueJob) {
  delete (mongoose.models as any).QueueJob
}

export const QueueJob: Model<IQueueJob> =
  mongoose.models.QueueJob ?? mongoose.model<IQueueJob>("QueueJob", QueueJobSchema)
