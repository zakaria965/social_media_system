import mongoose, { Schema, Document, Model } from "mongoose"

export interface IAnalyticsExport extends Document {
  workspaceId: mongoose.Types.ObjectId
  userId: string // user email
  reportType: string // default: "analytics"
  timeRange: string // "7d" | "30d" | "90d" | "12m"
  deliveryMethod: "download" | "email"
  exportedAt: Date
  createdAt: Date
  updatedAt: Date
}

const AnalyticsExportSchema = new Schema<IAnalyticsExport>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    userId: { type: String, required: true, index: true },
    reportType: { type: String, default: "analytics", index: true },
    timeRange: { type: String, required: true },
    deliveryMethod: { type: String, enum: ["download", "email"], default: "download" },
    exportedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, collection: "analytics_exports" }
)

if (mongoose.models && mongoose.models.AnalyticsExport) {
  delete (mongoose.models as any).AnalyticsExport
}

export const AnalyticsExport: Model<IAnalyticsExport> =
  mongoose.models.AnalyticsExport ??
  mongoose.model<IAnalyticsExport>("AnalyticsExport", AnalyticsExportSchema, "analytics_exports")
