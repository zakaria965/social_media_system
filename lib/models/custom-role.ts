import mongoose, { Schema, Document, Model } from "mongoose"

export interface ICustomRole extends Document {
  workspaceId: mongoose.Types.ObjectId
  name: string
  permissions: string[]
  createdAt: Date
  updatedAt: Date
}

const CustomRoleSchema = new Schema<ICustomRole>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    name: { type: String, required: true },
    permissions: [{ type: String }],
  },
  { timestamps: true }
)

if (mongoose.models && mongoose.models.CustomRole) {
  delete (mongoose.models as any).CustomRole
}

export const CustomRole: Model<ICustomRole> =
  mongoose.models.CustomRole ?? mongoose.model<ICustomRole>("CustomRole", CustomRoleSchema)
