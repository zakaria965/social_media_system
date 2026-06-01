import mongoose, { Schema, Document, Model } from "mongoose"

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "twitter"
  | "tiktok"

export type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed" | "cancelled"
export type PostType = "image" | "video" | "carousel" | "text"

export interface IPost extends Document {
  userId: string
  title: string
  content: string
  platforms: SocialPlatform[]
  status: PostStatus
  type: PostType
  scheduledAt: Date | null
  media: string[]
  hashtags: string[]
  link: string
  engagement: {
    likes: number
    comments: number
    shares: number
  }
  publishedAt: Date | null
  errorMessage: string | null
  facebookPostId: string | null
  facebookUrl: string | null
  facebookPageName: string | null
  facebookPublishedTime: Date | null
  createdAt: Date
  updatedAt: Date
}

const PostSchema = new Schema<IPost>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, default: "" },
    content: { type: String, default: "" },
    platforms: [{ type: String, enum: ["facebook", "instagram", "linkedin", "twitter", "tiktok"] }],
    status: {
      type: String,
      enum: ["draft", "scheduled", "publishing", "published", "failed", "cancelled"],
      default: "draft",
    },
    type: {
      type: String,
      enum: ["image", "video", "carousel", "text"],
      default: "text",
    },
    scheduledAt: { type: Date, default: null },
    media: [{ type: String }],
    hashtags: [{ type: String }],
    link: { type: String, default: "" },
    engagement: {
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
    },
    publishedAt: { type: Date, default: null },
    errorMessage: { type: String, default: null },
    facebookPostId: { type: String, default: null },
    facebookUrl: { type: String, default: null },
    facebookPageName: { type: String, default: null },
    facebookPublishedTime: { type: Date, default: null },
  },
  { timestamps: true }
)

// Delete compiled model cache to force Next.js to re-register the updated schema
if (mongoose.models && mongoose.models.Post) {
  delete (mongoose.models as any).Post
}

export const Post: Model<IPost> = mongoose.model<IPost>("Post", PostSchema)
