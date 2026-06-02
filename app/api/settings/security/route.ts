import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/user"
import { ActivityLog } from "@/lib/models/activity"
import { getActiveWorkspaceId } from "@/lib/workspaces"
import crypto from "crypto"

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email.toLowerCase().trim()
    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const workspaceId = await getActiveWorkspaceId(email, request)
    const body = await request.json()
    const { action } = body

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    // 1. Password Change Action
    if (action === "change-password") {
      const { currentPassword, newPassword } = body
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: "Current and new passwords are required" }, { status: 400 })
      }

      const currentHash = hashPassword(currentPassword)
      // Check if user has a password set. If not, we allow setting it. If they do, verify it.
      if (user.passwordHash && user.passwordHash !== currentHash) {
        return NextResponse.json({ error: "Invalid current password" }, { status: 400 })
      }

      user.passwordHash = hashPassword(newPassword)
      await user.save()

      // Log in ActivityLog
      await ActivityLog.create({
        userId: email,
        workspaceId,
        action: "change_password",
        details: "Changed personal account password successfully.",
        status: "success",
      })

      return NextResponse.json({ success: true, message: "Password updated successfully" })
    }

    // 2. Toggle Two-Factor Authentication Action
    if (action === "toggle-2fa") {
      const { enable } = body
      if (enable === undefined) {
        return NextResponse.json({ error: "Enable parameter is required" }, { status: 400 })
      }

      if (enable) {
        // Generate simulated secret and recovery codes
        const secret = "GWAY-" + crypto.randomBytes(6).toString("hex").toUpperCase()
        const codes = Array.from({ length: 8 }, () =>
          crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 4) +
          "-" +
          crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 4)
        )

        user.twoFactorEnabled = true
        user.twoFactorSecret = secret
        user.recoveryCodes = codes
        await user.save()

        await ActivityLog.create({
          userId: email,
          workspaceId,
          action: "enable_2fa",
          details: "Activated Two-Factor Authentication (2FA) and saved security keys.",
          status: "success",
        })

        return NextResponse.json({
          success: true,
          enabled: true,
          secret,
          recoveryCodes: codes,
        })
      } else {
        user.twoFactorEnabled = false
        user.twoFactorSecret = null
        user.recoveryCodes = []
        await user.save()

        await ActivityLog.create({
          userId: email,
          workspaceId,
          action: "disable_2fa",
          details: "Disabled Two-Factor Authentication (2FA) for personal account.",
          status: "success",
        })

        return NextResponse.json({
          success: true,
          enabled: false,
        })
      }
    }

    // 3. Revoke Session Action
    if (action === "revoke-session") {
      const { sessionId } = body
      if (!sessionId) {
        return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
      }

      // Filter session
      const targetSession = user.activeSessions.find((s) => s.id === sessionId)
      if (!targetSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }

      if (targetSession.current) {
        return NextResponse.json({ error: "Cannot revoke your active current session" }, { status: 400 })
      }

      // Add to login history as revoked
      user.loginHistory.push({
        id: crypto.randomUUID(),
        device: targetSession.device,
        browser: targetSession.browser,
        ip: targetSession.ip,
        location: targetSession.location,
        timestamp: new Date(),
        status: "failed", // Flagged as terminated/failed
      })

      // Revoke session
      user.activeSessions = user.activeSessions.filter((s) => s.id !== sessionId)
      await user.save()

      await ActivityLog.create({
        userId: email,
        workspaceId,
        action: "revoke_session",
        details: `Terminated active device session (IP: ${targetSession.ip}, Browser: ${targetSession.browser}).`,
        status: "success",
      })

      return NextResponse.json({ success: true, user })
    }

    return NextResponse.json({ error: "Invalid action specified" }, { status: 400 })
  } catch (err: any) {
    console.error("POST /api/settings/security error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
