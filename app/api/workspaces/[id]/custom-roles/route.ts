import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { CustomRole } from "@/lib/models/custom-role"
import { WorkspaceMember } from "@/lib/models/workspace-member"
import { verifyMemberPermission, logWorkspaceActivity } from "@/lib/workspaces"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: workspaceId } = await params
    await connectDB()

    // 1. Verify dashboard or team permission
    const check = await verifyMemberPermission(session.user.email, workspaceId, "dashboard")
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }

    // 2. Fetch all custom roles inside this workspace
    const customRoles = await CustomRole.find({ workspaceId }).sort({ name: 1 }).lean()

    return NextResponse.json({ customRoles })
  } catch (err: any) {
    console.error("GET /api/workspaces/[id]/custom-roles error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: workspaceId } = await params
    const body = await request.json()
    const { name, permissions } = body

    if (!name?.trim() || !Array.isArray(permissions)) {
      return NextResponse.json({ error: "Role name and permissions list are required" }, { status: 400 })
    }

    // Static role guard: Cannot modify static roles
    const normalized = name.trim().toLowerCase()
    if (["owner", "admin", "editor", "viewer"].includes(normalized)) {
      return NextResponse.json({ error: "Cannot create a custom role with a static system name" }, { status: 400 })
    }

    await connectDB()

    // 1. Verify team management permission
    const check = await verifyMemberPermission(session.user.email, workspaceId, "team")
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }

    // 2. Create or update the custom role permissions matrix
    const customRole = await CustomRole.findOneAndUpdate(
      { workspaceId, name: name.trim() },
      { $set: { permissions } },
      { new: true, upsert: true }
    )

    // 3. Log Activity
    await logWorkspaceActivity(
      workspaceId,
      session.user.email,
      "manage_roles",
      `Configured custom role "${name.trim()}" with ${permissions.length} permissions`
    )

    return NextResponse.json({ customRole })
  } catch (err: any) {
    console.error("POST /api/workspaces/[id]/custom-roles error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: workspaceId } = await params
    const { searchParams } = new URL(request.url)
    const name = searchParams.get("name")

    if (!name?.trim()) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 })
    }

    await connectDB()

    // 1. Verify team management permission
    const check = await verifyMemberPermission(session.user.email, workspaceId, "team")
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }

    // 2. Delete the custom role
    const deleted = await CustomRole.findOneAndDelete({ workspaceId, name: name.trim() })
    if (!deleted) {
      return NextResponse.json({ error: "Custom role not found" }, { status: 404 })
    }

    // 3. Demote active members who held this custom role to standard "viewer"
    await WorkspaceMember.updateMany(
      { workspaceId, role: name.trim() },
      { $set: { role: "viewer" } }
    )

    // 4. Log Activity
    await logWorkspaceActivity(
      workspaceId,
      session.user.email,
      "manage_roles",
      `Deleted custom role "${name.trim()}"`
    )

    return NextResponse.json({ success: true, message: `Role "${name.trim()}" successfully deleted and active users demoted to Viewer` })
  } catch (err: any) {
    console.error("DELETE /api/workspaces/[id]/custom-roles error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
