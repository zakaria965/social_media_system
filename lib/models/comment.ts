import mongoose, { Schema, Document, Model } from "mongoose"

export interface IInternalComment extends Document {
  postId: mongoose.Types.ObjectId
  workspaceId: mongoose.Types.ObjectId
  authorEmail: string
  authorName: string
  authorAvatar: string
  content: string
  createdAt: Date
  updatedAt: Date
}

const InternalCommentSchema = new Schema<IInternalComment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    authorEmail: { type: String, required: true },
    authorName: { type: String, default: "" },
    authorAvatar: { type: String, default: "" },
    content: { type: String, required: true },
  },
  { timestamps: true }
)

if (mongoose.models && mongoose.models.InternalComment) {
  delete (mongoose.models as any).InternalComment
}

export const InternalComment: Model<IInternalComment> =
  mongoose.models.InternalComment ?? mongoose.model<IInternalComment>("InternalComment", InternalCommentSchema)
