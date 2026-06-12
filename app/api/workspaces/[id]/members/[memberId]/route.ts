import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { Workspace } from "@/lib/models/workspace"
import { WorkspaceMember } from "@/lib/models/workspace-member"
import { WorkspaceInvitation } from "@/lib/models/workspace-invitation"
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

    // 2. Fetch the target to modify (either member or invite)
    let targetMember = await WorkspaceMember.findById(memberId)
    let isInvitation = false
    if (!targetMember) {
      targetMember = await WorkspaceInvitation.findById(memberId)
      isInvitation = true
    }

    if (!targetMember) {
      return NextResponse.json({ error: "Member or invitation not found" }, { status: 404 })
    }

    // 3. Hierarchy Rules Check
    const callerRole = check.role || ""
    const isCallerAdmin = ["admin", "Admin"].includes(callerRole)

    const targetRole = targetMember.role || ""
    const isTargetOwner = ["owner", "Workspace Owner"].includes(targetRole)
    const isTargetAdmin = ["admin", "Admin"].includes(targetRole)

    if (isCallerAdmin) {
      // Admins cannot change Owners or other Admins
      if (isTargetOwner || isTargetAdmin) {
        return NextResponse.json({ error: "Forbidden: Admins cannot edit Owners or other Admins" }, { status: 403 })
      }
      // Admins cannot elevate a member to Owner or Admin
      if (role && ["owner", "Workspace Owner", "admin", "Admin"].includes(role)) {
        return NextResponse.json({ error: "Forbidden: Admins cannot promote members to Owner or Admin" }, { status: 403 })
      }
    }

    // Owners cannot change their own Owner role (to prevent orphan workspaces)
    if (targetMember.email === session.user.email && isTargetOwner && role && !["owner", "Workspace Owner"].includes(role)) {
      return NextResponse.json({ error: "Forbidden: You cannot transfer Ownership here. Ownership is transferred automatically by deleting or through explicit billing options" }, { status: 400 })
    }

    // 4. Update the target
    if (role) targetMember.role = role
    if (customPermissions !== undefined) targetMember.customPermissions = customPermissions
    
    // Status is only applicable for WorkspaceMember (active), not WorkspaceInvitation (which is always pending)
    if (!isInvitation && status) {
      (targetMember as any).status = status
    }

    await targetMember.save()

    // 5. Log Activity
    await logWorkspaceActivity(
      workspaceId,
      session.user.email,
      "modify_member",
      `Updated member/invite permissions for "${targetMember.email}"`
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

    // 2. Fetch target member/invite to delete
    let targetMember = await WorkspaceMember.findById(memberId)
    let isInvitation = false
    if (!targetMember) {
      targetMember = await WorkspaceInvitation.findById(memberId)
      isInvitation = true
    }

    if (!targetMember) {
      return NextResponse.json({ error: "Member or invitation not found" }, { status: 404 })
    }

    // 3. Hierarchy Rules Check
    const callerRole = check.role || ""
    const isCallerAdmin = ["admin", "Admin"].includes(callerRole)

    const targetRole = targetMember.role || ""
    const isTargetOwner = ["owner", "Workspace Owner"].includes(targetRole)
    const isTargetAdmin = ["admin", "Admin"].includes(targetRole)

    if (isCallerAdmin) {
      // Admins cannot remove Owners or other Admins
      if (isTargetOwner || isTargetAdmin) {
        return NextResponse.json({ error: "Forbidden: Admins cannot remove Owners or other Admins" }, { status: 403 })
      }
    }

    // Owners cannot remove themselves
    if (targetMember.email === session.user.email && isTargetOwner) {
      return NextResponse.json({ error: "Forbidden: Owners cannot remove themselves. Delete the workspace instead" }, { status: 400 })
    }

    // 4. Remove member or invitation
    if (isInvitation) {
      await WorkspaceInvitation.findByIdAndDelete(memberId)
    } else {
      await WorkspaceMember.findByIdAndDelete(memberId)
    }

    // 5. Log Activity
    await logWorkspaceActivity(
      workspaceId,
      session.user.email,
      "remove_member",
      `Removed member/invite "${targetMember.email}"`
    )

    return NextResponse.json({ success: true, message: "Member/invite successfully removed" })
  } catch (err: any) {
    console.error("DELETE /api/workspaces/[id]/members/[memberId] error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
