import mongoose, { Schema, Document, Model } from "mongoose"

export type SocialPlatform = "facebook" | "instagram" | "linkedin" | "twitter" | "tiktok"
export type SocialActivityType = "comment" | "like" | "share" | "mention" | "reaction" | "retweet" | "message"
export type SentimentType = "positive" | "neutral" | "negative"

export interface IActivityReply {
  senderName: string
  senderAvatar: string
  text: string
  timestamp: Date
}

export interface ISocialActivity extends Document {
  userId: string // GrowWave user email
  accountId: string // Reference to SocialAccount ID
  postId: string | null // Reference to published Post ID (if applicable)
  platform: SocialPlatform
  type: SocialActivityType
  profileName: string // Handle or name of the audience member
  profileAvatar: string // Avatar of the audience member
  text: string // Comment body or notification description
  timestamp: Date
  postTitle: string // Post title reference for display
  postContent: string // Post content reference for display
  replies: IActivityReply[]
  sentiment: SentimentType
  isComplaint: boolean
  isOpportunity: boolean
  faqQuestion?: string
  read: boolean
  createdAt: Date
  updatedAt: Date
}

const SocialActivitySchema = new Schema<ISocialActivity>(
  {
    userId: { type: String, required: true, index: true },
    accountId: { type: String, required: true, index: true },
    postId: { type: String, default: null, index: true },
    platform: {
      type: String,
      enum: ["facebook", "instagram", "linkedin", "twitter", "tiktok"],
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["comment", "like", "share", "mention", "reaction", "retweet", "message"],
      required: true,
      index: true,
    },
    profileName: { type: String, required: true, index: true },
    profileAvatar: { type: String, default: "" },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    postTitle: { type: String, default: "" },
    postContent: { type: String, default: "" },
    replies: [
      {
        senderName: { type: String, required: true },
        senderAvatar: { type: String, default: "" },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: "neutral",
      index: true,
    },
    isComplaint: { type: Boolean, default: false, index: true },
    isOpportunity: { type: Boolean, default: false, index: true },
    faqQuestion: { type: String, default: "" },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
)

if (mongoose.models && mongoose.models.SocialActivity) {
  delete (mongoose.models as any).SocialActivity
}

export const SocialActivity: Model<ISocialActivity> =
  mongoose.models.SocialActivity ??
  mongoose.model<ISocialActivity>("SocialActivity", SocialActivitySchema)
