import mongoose, { Schema, Document, Model } from "mongoose"

export interface IPublishedPost extends Document {
  userId: string
  workspaceId: string | null
  postId: string | null
  channel: string
  platform: string | null
  content: string | null
  mediaUrls: string[]
  status: string
  socialPostId: string | null
  publishedAt: Date
  createdAt: Date
  updatedAt: Date
}

const PublishedPostSchema = new Schema<IPublishedPost>(
  {
    userId: { type: String, required: true, index: true },
    workspaceId: { type: String, default: null, index: true },
    postId: { type: String, default: null, index: true },
    channel: { type: String, required: true },
    platform: { type: String, default: null },
    content: { type: String, default: null },
    mediaUrls: [{ type: String }],
    status: { type: String, default: "published" },
    socialPostId: { type: String, default: null },
    publishedAt: { type: Date, default: Date.now, index: true },
  },
  { collection: "published_posts", timestamps: true }
)

// Delete compiled model cache to force Next.js to re-register the updated schema
if (mongoose.models && mongoose.models.PublishedPost) {
  delete (mongoose.models as any).PublishedPost
}

export const PublishedPost: Model<IPublishedPost> =
  mongoose.models.PublishedPost ?? mongoose.model<IPublishedPost>("PublishedPost", PublishedPostSchema, "published_posts")
