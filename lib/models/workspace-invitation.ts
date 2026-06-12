import mongoose, { Schema, Document, Model } from "mongoose"

export interface IWorkspaceInvitation extends Document {
  workspaceId: mongoose.Types.ObjectId
  email: string
  role: string
  invitedBy: string
  inviteToken: string
  inviteExpiresAt: Date
  customPermissions: string[]
  createdAt: Date
  updatedAt: Date
}

const WorkspaceInvitationSchema = new Schema<IWorkspaceInvitation>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    email: { type: String, required: true, index: true },
    role: { type: String, required: true },
    invitedBy: { type: String, required: true },
    inviteToken: { type: String, required: true, index: true },
    inviteExpiresAt: { type: Date, required: true },
    customPermissions: [{ type: String }],
  },
  { timestamps: true, collection: "team_invitations" }
)

if (mongoose.models && mongoose.models.WorkspaceInvitation) {
  delete (mongoose.models as any).WorkspaceInvitation
}

export const WorkspaceInvitation: Model<IWorkspaceInvitation> =
  mongoose.models.WorkspaceInvitation ??
  mongoose.model<IWorkspaceInvitation>("WorkspaceInvitation", WorkspaceInvitationSchema, "team_invitations")
