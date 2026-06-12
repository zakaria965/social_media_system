import mongoose, { Schema, Document, Model } from "mongoose"

export interface IWorkspaceMember extends Document {
  workspaceId: mongoose.Types.ObjectId
  email: string
  name: string
  avatar: string
  role: "owner" | "admin" | "editor" | "viewer" | string
  status: "active" | "pending" | "declined"
  joinedAt: Date | null
  lastActive: Date | null
  customPermissions: string[]
  invitedBy: string | null
  inviteToken: string | null
  inviteExpiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const WorkspaceMemberSchema = new Schema<IWorkspaceMember>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    email: { type: String, required: true, index: true },
    name: { type: String, default: "" },
    avatar: { type: String, default: "" },
    role: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "pending", "declined"],
      default: "active",
      index: true,
    },
    joinedAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
    customPermissions: [{ type: String }],
    invitedBy: { type: String, default: null },
    inviteToken: { type: String, default: null, index: true },
    inviteExpiresAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "team_members" }
)

if (mongoose.models && mongoose.models.WorkspaceMember) {
  delete (mongoose.models as any).WorkspaceMember
}

export const WorkspaceMember: Model<IWorkspaceMember> =
  mongoose.models.WorkspaceMember ??
  mongoose.model<IWorkspaceMember>("WorkspaceMember", WorkspaceMemberSchema, "team_members")
