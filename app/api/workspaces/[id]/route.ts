import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { Workspace } from "@/lib/models/workspace"
import { WorkspaceMember } from "@/lib/models/workspace-member"
import { Post } from "@/lib/models/post"
import { SocialAccount } from "@/lib/models/account"
import { Media } from "@/lib/models/media"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await connectDB()

    const workspace = await Workspace.findById(id)
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // Security check: Only the owner can delete the workspace
    if (workspace.ownerEmail !== session.user.email) {
      return NextResponse.json({ error: "Forbidden: Only the workspace Owner can delete this workspace" }, { status: 403 })
    }

    // Delete workspace and all associated resources
    await Promise.all([
      Workspace.findByIdAndDelete(id),
      WorkspaceMember.deleteMany({ workspaceId: id }),
      Post.deleteMany({ workspaceId: id }),
      SocialAccount.deleteMany({ workspaceId: id }),
      Media.deleteMany({ workspaceId: id }),
    ])

    return NextResponse.json({ success: true, message: "Workspace and all associated resources successfully deleted" })
  } catch (err: any) {
    console.error("DELETE /api/workspaces/[id] error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
