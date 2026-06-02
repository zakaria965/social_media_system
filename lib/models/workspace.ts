import mongoose, { Schema, Document, Model } from "mongoose"

export interface IWorkspace extends Document {
  name: string
  ownerEmail: string
  createdAt: Date
  updatedAt: Date
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true },
    ownerEmail: { type: String, required: true, index: true },
  },
  { timestamps: true }
)

if (mongoose.models && mongoose.models.Workspace) {
  delete (mongoose.models as any).Workspace
}

export const Workspace: Model<IWorkspace> =
  mongoose.models.Workspace ?? mongoose.model<IWorkspace>("Workspace", WorkspaceSchema)
