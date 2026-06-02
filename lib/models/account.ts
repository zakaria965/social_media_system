import mongoose, { Schema, Document, Model } from "mongoose"

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "twitter"
  | "tiktok"

export interface ISocialAccount extends Document {
  userId: string
  workspaceId: mongoose.Types.ObjectId | null
  platform: SocialPlatform
  username: string
  avatar: string
  accessToken: string
  refreshToken: string | null
  tokenExpiresAt: Date | null
  platformAccountId: string
  followers: number
  engagement: number
  status:
    | "connected"
    | "disconnected"
    | "expired"
    | "permission_error"
    | "sync_error"
    | "pending"
  createdAt: Date
  updatedAt: Date
}

const SocialAccountSchema = new Schema<ISocialAccount>(
  {
    userId: { type: String, required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", default: null, index: true },
    platform: {
      type: String,
      enum: ["facebook", "instagram", "linkedin", "twitter", "tiktok"],
      required: true,
    },
    username: { type: String, default: "" },
    avatar: { type: String, default: "" },
    accessToken: { type: String, default: "" },
    refreshToken: { type: String, default: null },
    tokenExpiresAt: { type: Date, default: null },
    platformAccountId: { type: String, default: "" },
    followers: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        "connected",
        "disconnected",
        "expired",
        "permission_error",
        "sync_error",
        "pending",
      ],
      default: "connected",
    },
  },
  { timestamps: true }
)

export const SocialAccount: Model<ISocialAccount> =
  mongoose.models.SocialAccount ??
  mongoose.model<ISocialAccount>("SocialAccount", SocialAccountSchema)
