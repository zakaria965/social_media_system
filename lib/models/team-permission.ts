import mongoose, { Schema, Document, Model } from "mongoose"

export interface ITeamPermission extends Document {
  workspaceId: mongoose.Types.ObjectId
  role: string
  permissions: string[]
  createdAt: Date
  updatedAt: Date
}

const TeamPermissionSchema = new Schema<ITeamPermission>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    role: { type: String, required: true },
    permissions: [{ type: String }],
  },
  { timestamps: true, collection: "team_permissions" }
)

if (mongoose.models && mongoose.models.TeamPermission) {
  delete (mongoose.models as any).TeamPermission
}

export const TeamPermission: Model<ITeamPermission> =
  mongoose.models.TeamPermission ??
  mongoose.model<ITeamPermission>("TeamPermission", TeamPermissionSchema, "team_permissions")
