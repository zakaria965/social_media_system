import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { Workspace } from "@/lib/models/workspace"
import { WorkspaceMember } from "@/lib/models/workspace-member"
import { getOrCreateDefaultWorkspace, logWorkspaceActivity } from "@/lib/workspaces"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Retrieve or create default workspace and migrate legacy assets
    const { workspaces, memberships } = await getOrCreateDefaultWorkspace(
      session.user.email,
      session.user.name || undefined
    )

    return NextResponse.json({ workspaces, memberships })
  } catch (err: any) {
    console.error("GET /api/workspaces error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await request.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: "Workspace name is required" }, { status: 400 })
    }

    await connectDB()

    // 1. Create Workspace
    const newWorkspace = await Workspace.create({
      name: name.trim(),
      ownerEmail: session.user.email,
    })

    // 2. Add Owner Member
    await WorkspaceMember.create({
      workspaceId: newWorkspace._id,
      email: session.user.email,
      name: session.user.name || session.user.email.split("@")[0],
      avatar: session.user.image || "",
      role: "owner",
      status: "active",
      joinedAt: new Date(),
      lastActive: new Date(),
    })

    // 3. Log Activity
    await logWorkspaceActivity(
      newWorkspace._id,
      session.user.email,
      "create_workspace",
      `Created workspace "${newWorkspace.name}"`
    )

    return NextResponse.json({ workspace: newWorkspace }, { status: 201 })
  } catch (err: any) {
    console.error("POST /api/workspaces error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
