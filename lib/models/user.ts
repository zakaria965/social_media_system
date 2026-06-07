import mongoose, { Schema, Document, Model } from "mongoose"

export interface ISessionHistory {
  id: string
  device: string
  browser: string
  ip: string
  location: string
  lastActive: Date
  current: boolean
}

export interface ILoginHistory {
  id: string
  device: string
  browser: string
  ip: string
  location: string
  timestamp: Date
  status: "success" | "failed"
}

export interface IUser extends Document {
  email: string
  name: string
  username: string
  bio: string
  avatar: string
  passwordHash: string | null
  timezone: string
  country: string
  language: string
  dateFormat: string
  timeFormat: string
  googleConnected: boolean
  twoFactorEnabled: boolean
  twoFactorSecret: string | null
  recoveryCodes: string[]
  theme: "light" | "dark" | "system"
  accentColor: string
  sidebarDensity: "comfortable" | "compact"
  animationsEnabled: boolean
  activeSessions: ISessionHistory[]
  loginHistory: ILoginHistory[]
  plan?: "FREE" | "PRO"
  subscriptionStatus?: "ACTIVE" | "CANCELLED" | "EXPIRED"
  role: "USER" | "ADMIN"
  status: "ACTIVE" | "SUSPENDED"
  aiEnabled?: boolean
  monthlyTokenLimit?: number
  monthlyRequestLimit?: number
  tokensUsed?: number
  requestsUsed?: number
  resetDate?: Date
  bonusTokens?: number
  bonusRequests?: number
  createdAt: Date
  updatedAt: Date
}

const SessionHistorySchema = new Schema<ISessionHistory>({
  id: { type: String, required: true },
  device: { type: String, default: "Unknown Device" },
  browser: { type: String, default: "Unknown Browser" },
  ip: { type: String, default: "127.0.0.1" },
  location: { type: String, default: "Local Host" },
  lastActive: { type: Date, default: Date.now },
  current: { type: Boolean, default: false },
})

const LoginHistorySchema = new Schema<ILoginHistory>({
  id: { type: String, required: true },
  device: { type: String, default: "Unknown Device" },
  browser: { type: String, default: "Unknown Browser" },
  ip: { type: String, default: "127.0.0.1" },
  location: { type: String, default: "Local Host" },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ["success", "failed"], default: "success" },
})

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "" },
    username: { type: String, default: "" },
    bio: { type: String, default: "" },
    avatar: { type: String, default: "" },
    passwordHash: { type: String, default: null },
    timezone: { type: String, default: "UTC" },
    country: { type: String, default: "United States" },
    language: { type: String, default: "English (US)" },
    dateFormat: { type: String, default: "MM/DD/YYYY" },
    timeFormat: { type: String, default: "12h" },
    googleConnected: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: null },
    recoveryCodes: [{ type: String }],
    theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
    accentColor: { type: String, default: "#0f766e" }, // GrowWave emerald accent
    sidebarDensity: { type: String, enum: ["comfortable", "compact"], default: "comfortable" },
    animationsEnabled: { type: Boolean, default: true },
    activeSessions: [SessionHistorySchema],
    loginHistory: [LoginHistorySchema],
    plan: { type: String, enum: ["FREE", "PRO"], default: "FREE" },
    subscriptionStatus: { type: String, enum: ["ACTIVE", "CANCELLED", "EXPIRED"], default: "ACTIVE" },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    status: { type: String, enum: ["ACTIVE", "SUSPENDED"], default: "ACTIVE" },
    aiEnabled: { type: Boolean, default: true },
    monthlyTokenLimit: { type: Number, default: 50000 },
    monthlyRequestLimit: { type: Number, default: 50 },
    tokensUsed: { type: Number, default: 0 },
    requestsUsed: { type: Number, default: 0 },
    resetDate: {
      type: Date,
      default: () => {
        const d = new Date()
        d.setMonth(d.getMonth() + 1)
        d.setDate(1)
        d.setHours(0, 0, 0, 0)
        return d
      }
    },
    bonusTokens: { type: Number, default: 0 },
    bonusRequests: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// Prevent hot-reload re-compilation errors in development environment
if (mongoose.models && mongoose.models.User) {
  delete (mongoose.models as any).User
}

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema)
