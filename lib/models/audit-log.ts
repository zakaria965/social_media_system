import mongoose, { Schema, Document, Model } from "mongoose"

export interface IAuditLog extends Document {
  action: string
  actor: string
  resource: string
  ipAddress: string
  details: string
  timestamp: Date
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    actor: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    ipAddress: { type: String, default: "127.0.0.1" },
    details: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
  }
)

if (mongoose.models && mongoose.models.AuditLog) {
  delete (mongoose.models as any).AuditLog
}

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ?? mongoose.model<IAuditLog>("AuditLog", AuditLogSchema)
