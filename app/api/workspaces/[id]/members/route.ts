import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { Workspace } from "@/lib/models/workspace"
import { WorkspaceMember } from "@/lib/models/workspace-member"
import { verifyMemberPermission, logWorkspaceActivity } from "@/lib/workspaces"
import crypto from "crypto"

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

    // 1. Verify that the caller is a member of the workspace
    const check = await verifyMemberPermission(session.user.email, workspaceId, "team")
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }

    // 2. Fetch all members (both active and pending/declined)
    const members = await WorkspaceMember.find({ workspaceId }).sort({ role: 1, name: 1 }).lean()

    return NextResponse.json({ members })
  } catch (err: any) {
    console.error("GET /api/workspaces/[id]/members error:", err)
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
    const { email, role, customPermissions } = body

    if (!email?.trim() || !role?.trim()) {
      return NextResponse.json({ error: "Email and Role are required" }, { status: 400 })
    }

    await connectDB()

    // 1. Verify team-management permission
    const check = await verifyMemberPermission(session.user.email, workspaceId, "team")
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }

    // 2. Verify that the user isn't already a member of the workspace
    const existingMember = await WorkspaceMember.findOne({ workspaceId, email: email.trim().toLowerCase() })
    if (existingMember) {
      if (existingMember.status === "active") {
        return NextResponse.json({ error: "User is already an active member of this workspace" }, { status: 400 })
      }
      // If invitation was declined or expired, we can overwrite/re-invite them below.
    }

    // 3. Generate secure invite token and details
    const inviteToken = crypto.randomBytes(32).toString("hex")
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

    let member
    if (existingMember) {
      existingMember.role = role
      existingMember.status = "pending"
      existingMember.inviteToken = inviteToken
      existingMember.inviteExpiresAt = inviteExpiresAt
      existingMember.invitedBy = session.user.email
      existingMember.customPermissions = customPermissions || []
      await existingMember.save()
      member = existingMember
    } else {
      member = await WorkspaceMember.create({
        workspaceId,
        email: email.trim().toLowerCase(),
        name: email.trim().split("@")[0],
        role,
        status: "pending",
        inviteToken,
        inviteExpiresAt,
        invitedBy: session.user.email,
        customPermissions: customPermissions || [],
      })
    }

    // 4. Log Activity
    await logWorkspaceActivity(
      workspaceId,
      session.user.email,
      "invite_user",
      `Invited user "${email}" as "${role}"`
    )

    return NextResponse.json({ member }, { status: 201 })
  } catch (err: any) {
    console.error("POST /api/workspaces/[id]/members error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
