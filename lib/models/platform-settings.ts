import mongoose, { Schema, Document, Model } from "mongoose"

export interface IPlatformSettings extends Document {
  openaiKey: string
  openaiModel: string
  openaiTokenLimit: number
  openaiMonthlyBudget: number
  openaiEmergencyShutdown: boolean
  openaiUsageAlerts: boolean
  aiProvider: string
  fbAppId: string
  fbAppSecret: string
  fbGraphVersion: string
  fbRedirectUrl: string
  fbWebhookSecret: string
  maintenanceMode: boolean
  generalSiteName: string
  generalContactEmail: string
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPass: string
  smtpSender: string
  createdAt: Date
  updatedAt: Date
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    openaiKey: { type: String, default: "" },
    openaiModel: { type: String, default: "gpt-4o-mini" },
    openaiTokenLimit: { type: Number, default: 500000 }, // Tokens limit per user/month
    openaiMonthlyBudget: { type: Number, default: 50.0 }, // Monthly maximum OpenAI budget in USD
    openaiEmergencyShutdown: { type: Boolean, default: false },
    openaiUsageAlerts: { type: Boolean, default: true },
    aiProvider: { type: String, enum: ["openai", "gemini", "auto"], default: "gemini" },
    
    fbAppId: { type: String, default: "" },
    fbAppSecret: { type: String, default: "" },
    fbGraphVersion: { type: String, default: "v20.0" },
    fbRedirectUrl: { type: String, default: "" },
    fbWebhookSecret: { type: String, default: "" },
    
    maintenanceMode: { type: Boolean, default: false },
    generalSiteName: { type: String, default: "GrowWave" },
    generalContactEmail: { type: String, default: "support@growwave.com" },
    
    smtpHost: { type: String, default: "" },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: "" },
    smtpPass: { type: String, default: "" },
    smtpSender: { type: String, default: "" },
  },
  { timestamps: true }
)

if (mongoose.models && mongoose.models.PlatformSettings) {
  delete (mongoose.models as any).PlatformSettings
}

export const PlatformSettings: Model<IPlatformSettings> =
  mongoose.models.PlatformSettings ?? mongoose.model<IPlatformSettings>("PlatformSettings", PlatformSettingsSchema)
