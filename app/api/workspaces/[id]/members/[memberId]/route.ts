import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { Workspace } from "@/lib/models/workspace"
import { WorkspaceMember } from "@/lib/models/workspace-member"
import { verifyMemberPermission, logWorkspaceActivity } from "@/lib/workspaces"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: workspaceId, memberId } = await params
    const body = await request.json()
    const { role, customPermissions, status } = body

    await connectDB()

    // 1. Verify caller has team management permission
    const check = await verifyMemberPermission(session.user.email, workspaceId, "team")
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }

    // 2. Fetch the target member to modify
    const targetMember = await WorkspaceMember.findById(memberId)
    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // 3. Hierarchy Rules Check
    const callerRole = check.role
    if (callerRole === "admin") {
      // Admins cannot change Owners or other Admins
      if (targetMember.role === "owner" || targetMember.role === "admin") {
        return NextResponse.json({ error: "Forbidden: Admins cannot edit Owners or other Admins" }, { status: 403 })
      }
      // Admins cannot elevate a member to Owner or Admin
      if (role === "owner" || role === "admin") {
        return NextResponse.json({ error: "Forbidden: Admins cannot promote members to Owner or Admin" }, { status: 403 })
      }
    }

    // Owners cannot change their own Owner role (to prevent orphan workspaces)
    if (targetMember.email === session.user.email && targetMember.role === "owner" && role && role !== "owner") {
      return NextResponse.json({ error: "Forbidden: You cannot transfer Ownership here. Ownership is transferred automatically by deleting or through explicit billing options" }, { status: 400 })
    }

    // 4. Update the target member
    if (role) targetMember.role = role
    if (customPermissions !== undefined) targetMember.customPermissions = customPermissions
    if (status) targetMember.status = status

    await targetMember.save()

    // 5. Log Activity
    await logWorkspaceActivity(
      workspaceId,
      session.user.email,
      "modify_member",
      `Updated member permissions for "${targetMember.email}"`
    )

    return NextResponse.json({ member: targetMember })
  } catch (err: any) {
    console.error("PATCH /api/workspaces/[id]/members/[memberId] error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: workspaceId, memberId } = await params
    await connectDB()

    // 1. Verify caller has team management permission
    const check = await verifyMemberPermission(session.user.email, workspaceId, "team")
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }

    // 2. Fetch target member to delete
    const targetMember = await WorkspaceMember.findById(memberId)
    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // 3. Hierarchy Rules Check
    const callerRole = check.role
    if (callerRole === "admin") {
      // Admins cannot remove Owners or other Admins
      if (targetMember.role === "owner" || targetMember.role === "admin") {
        return NextResponse.json({ error: "Forbidden: Admins cannot remove Owners or other Admins" }, { status: 403 })
      }
    }

    // Owners cannot remove themselves
    if (targetMember.email === session.user.email && targetMember.role === "owner") {
      return NextResponse.json({ error: "Forbidden: Owners cannot remove themselves. Delete the workspace instead" }, { status: 400 })
    }

    // 4. Remove member
    await WorkspaceMember.findByIdAndDelete(memberId)

    // 5. Log Activity
    await logWorkspaceActivity(
      workspaceId,
      session.user.email,
      "remove_member",
      `Removed member/invite "${targetMember.email}"`
    )

    return NextResponse.json({ success: true, message: "Member successfully removed" })
  } catch (err: any) {
    console.error("DELETE /api/workspaces/[id]/members/[memberId] error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
