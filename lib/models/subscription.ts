import mongoose, { Schema, Document, Model } from "mongoose"

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId
  plan: "FREE" | "PRO"
  status: "ACTIVE" | "CANCELLED" | "EXPIRED"
  billingCycle: "monthly" | "yearly" | "free"
  startedAt: Date
  expiresAt: Date
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  createdAt: Date
  updatedAt: Date
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: { type: String, enum: ["FREE", "PRO"], default: "FREE" },
    status: { type: String, enum: ["ACTIVE", "CANCELLED", "EXPIRED"], default: "ACTIVE" },
    billingCycle: { type: String, enum: ["monthly", "yearly", "free"], default: "free" },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }, // 1 year default for free
    stripeCustomerId: { type: String, default: "" },
    stripeSubscriptionId: { type: String, default: "" },
  },
  { timestamps: true }
)

if (mongoose.models && mongoose.models.Subscription) {
  delete (mongoose.models as any).Subscription
}

export const Subscription: Model<ISubscription> =
  mongoose.models.Subscription ?? mongoose.model<ISubscription>("Subscription", SubscriptionSchema)
