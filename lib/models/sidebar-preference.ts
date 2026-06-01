import mongoose, { Schema, Document, Model } from "mongoose"

export interface ISidebarPreference extends Document {
  userId: string
  structure: any
  sectionsExpanded: any
  isCollapsed: boolean
  createdAt: Date
  updatedAt: Date
}

const SidebarPreferenceSchema = new Schema<ISidebarPreference>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    structure: { type: Schema.Types.Mixed, required: true },
    sectionsExpanded: { type: Schema.Types.Mixed, default: {} },
    isCollapsed: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Delete model compiled cache to force fresh registering on Next.js hot-reloads
if (mongoose.models && mongoose.models.SidebarPreference) {
  delete (mongoose.models as any).SidebarPreference
}

export const SidebarPreference: Model<ISidebarPreference> =
  mongoose.models.SidebarPreference ??
  mongoose.model<ISidebarPreference>("SidebarPreference", SidebarPreferenceSchema)
