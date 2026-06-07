import mongoose, { Schema, Document, Model } from "mongoose"

export interface IPayment extends Document {
  transactionId: string
  userId: string
  userEmail: string
  amount: number
  status: "SUCCESS" | "FAILED" | "PENDING" | "REFUNDED"
  plan: "FREE" | "PRO"
  billingCycle: "monthly" | "yearly" | "free"
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<IPayment>(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["SUCCESS", "FAILED", "PENDING", "REFUNDED"], default: "SUCCESS" },
    plan: { type: String, enum: ["FREE", "PRO"], default: "FREE" },
    billingCycle: { type: String, enum: ["monthly", "yearly", "free"], default: "free" },
  },
  { timestamps: true }
)

if (mongoose.models && mongoose.models.Payment) {
  delete (mongoose.models as any).Payment
}

export const Payment: Model<IPayment> =
  mongoose.models.Payment ?? mongoose.model<IPayment>("Payment", PaymentSchema)
