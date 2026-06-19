import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { Workspace } from "@/lib/models/workspace"
import { WorkspaceMember } from "@/lib/models/workspace-member"
import { WorkspaceInvitation } from "@/lib/models/workspace-invitation"
import { verifyMemberPermission, logWorkspaceActivity } from "@/lib/workspaces"
import { AuditLog } from "@/lib/models/audit-log"
import { syncManager } from "@/lib/sync"

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
    const isCallerOwner = ["owner", "Workspace Owner"].includes(callerRole)
    const isCallerAdmin = ["admin", "Admin", "Workspace Manager"].includes(callerRole)

    const targetRole = targetMember.role || ""
    const isTargetOwner = ["owner", "Workspace Owner"].includes(targetRole)
    const isTargetAdmin = ["admin", "Admin", "Workspace Manager"].includes(targetRole)

    if (isCallerAdmin) {
      // Workspace Managers cannot change Owners or other Workspace Managers
      if (isTargetOwner || isTargetAdmin) {
        return NextResponse.json({ error: "Forbidden: Workspace Managers cannot edit Owners or other Managers" }, { status: 403 })
      }
      // Workspace Managers cannot elevate a member to Owner or Workspace Manager
      if (role && ["owner", "Workspace Owner", "admin", "Admin", "Workspace Manager"].includes(role)) {
        return NextResponse.json({ error: "Forbidden: Workspace Managers cannot promote members to Owner or Workspace Manager" }, { status: 403 })
      }
    }

    // Owner transfer logic
    let ownerTransferred = false
    if (role && ["owner", "Workspace Owner"].includes(role)) {
      if (!isCallerOwner) {
        return NextResponse.json({ error: "Forbidden: Only the Workspace Owner can transfer ownership" }, { status: 403 })
      }
      if (targetMember.email === session.user.email) {
        return NextResponse.json({ error: "Forbidden: You are already the owner" }, { status: 400 })
      }

      // Perform transfer
      const ws = await Workspace.findById(workspaceId)
      if (ws) {
        ws.ownerEmail = targetMember.email.toLowerCase()
        await ws.save()
      }

      // Demote current owner to Workspace Manager
      await WorkspaceMember.updateOne(
        { workspaceId, email: session.user.email },
        { $set: { role: "Workspace Manager" } }
      )

      ownerTransferred = true
    }

    // Owners cannot change their own Owner role directly (to prevent orphan workspaces) without transferring
    if (targetMember.email === session.user.email && isTargetOwner && role && !["owner", "Workspace Owner"].includes(role) && !ownerTransferred) {
      return NextResponse.json({ error: "Forbidden: You cannot directly demote yourself. Transfer ownership to another member first." }, { status: 400 })
    }

    // 4. Update the target
    const oldRole = targetMember.role
    const oldStatus = (targetMember as any).status
    const oldPermissions = targetMember.customPermissions || []

    if (role) targetMember.role = role
    if (customPermissions !== undefined) targetMember.customPermissions = customPermissions
    
    // Status is only applicable for WorkspaceMember (active), not WorkspaceInvitation (which is always pending)
    if (!isInvitation && status) {
      (targetMember as any).status = status
    }

    await targetMember.save()

    // 5. Log Activity specifically
    if (ownerTransferred) {
      await logWorkspaceActivity(
        workspaceId,
        session.user.email,
        "role_changed",
        `Transferred workspace ownership to "${targetMember.email}"`
      )
      await AuditLog.create({
        action: "Role Changed",
        actor: session.user.email,
        resource: "team_management",
        workspaceId,
        targetEmail: targetMember.email.toLowerCase(),
        details: `Transferred workspace ownership to "${targetMember.email}"`,
      })
    } else if (role && role !== oldRole) {
      await logWorkspaceActivity(
        workspaceId,
        session.user.email,
        "role_changed",
        `Changed role of "${targetMember.email}" from "${oldRole}" to "${role}"`
      )
      await AuditLog.create({
        action: "Role Changed",
        actor: session.user.email,
        resource: "team_management",
        workspaceId,
        targetEmail: targetMember.email.toLowerCase(),
        details: `Changed role of "${targetMember.email}" from "${oldRole}" to "${role}"`,
      })
    } else if (!isInvitation && status && status !== oldStatus) {
      const action = status === "suspended" ? "member_suspended" : "member_unsuspended"
      const detail = status === "suspended" ? `Suspended member "${targetMember.email}"` : `Unsuspended member "${targetMember.email}"`
      await logWorkspaceActivity(
        workspaceId,
        session.user.email,
        action,
        detail
      )
      await AuditLog.create({
        action: status === "suspended" ? "Member Suspended" : "Member Activated",
        actor: session.user.email,
        resource: "team_management",
        workspaceId,
        targetEmail: targetMember.email.toLowerCase(),
        details: status === "suspended" ? `Suspended member "${targetMember.email}"` : `Activated member "${targetMember.email}"`,
      })
    } else if (customPermissions !== undefined && JSON.stringify(customPermissions) !== JSON.stringify(oldPermissions)) {
      await logWorkspaceActivity(
        workspaceId,
        session.user.email,
        "permission_updated",
        `Updated custom permissions for "${targetMember.email}"`
      )
      await AuditLog.create({
        action: "Permissions Updated",
        actor: session.user.email,
        resource: "team_management",
        workspaceId,
        targetEmail: targetMember.email.toLowerCase(),
        details: `Updated custom permissions for "${targetMember.email}"`,
      })
    } else {
      await logWorkspaceActivity(
        workspaceId,
        session.user.email,
        "modify_member",
        `Modified member details for "${targetMember.email}"`
      )
    }

    // Real-time synchronization broadcasts
    if (!isInvitation) {
      const targetEmail = targetMember.email.toLowerCase()
      if (status && status !== oldStatus) {
        const event = status === "suspended" ? "member.suspended" : "member.activated"
        syncManager.broadcastMemberUpdate(targetEmail, event, { workspaceId })
      }
      if (role && role !== oldRole) {
        syncManager.broadcastMemberUpdate(targetEmail, "member.role_changed", { workspaceId, role })
      }
      if (customPermissions !== undefined && JSON.stringify(customPermissions) !== JSON.stringify(oldPermissions)) {
        syncManager.broadcastMemberUpdate(targetEmail, "member.permissions_updated", { workspaceId, customPermissions })
      }
    }

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
    const isCallerOwner = ["owner", "Workspace Owner"].includes(callerRole)
    const isCallerAdmin = ["admin", "Admin", "Workspace Manager"].includes(callerRole)

    const targetRole = targetMember.role || ""
    const isTargetOwner = ["owner", "Workspace Owner"].includes(targetRole)
    const isTargetAdmin = ["admin", "Admin", "Workspace Manager"].includes(targetRole)

    if (isCallerAdmin) {
      // Workspace Managers cannot remove Owners or other Workspace Managers
      if (isTargetOwner || isTargetAdmin) {
        return NextResponse.json({ error: "Forbidden: Workspace Managers cannot remove Owners or other Managers" }, { status: 403 })
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
    const action = isInvitation ? "invite_cancelled" : "member_removed"
    const detail = isInvitation ? `Cancelled invitation for "${targetMember.email}"` : `Removed member "${targetMember.email}"`
    await logWorkspaceActivity(
      workspaceId,
      session.user.email,
      action,
      detail
    )

    // Log to AuditLog
    await AuditLog.create({
      action: "Member Removed",
      actor: session.user.email,
      resource: "team_management",
      workspaceId,
      targetEmail: targetMember.email.toLowerCase(),
      details: isInvitation ? `Cancelled invitation for "${targetMember.email}"` : `Removed member "${targetMember.email}"`,
    })

    // Real-time synchronization broadcasts for removal
    if (!isInvitation) {
      syncManager.broadcastMemberUpdate(targetMember.email, "member.removed", { workspaceId })
    }

    return NextResponse.json({ success: true, message: "Member/invite successfully removed" })
  } catch (err: any) {
    console.error("DELETE /api/workspaces/[id]/members/[memberId] error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
