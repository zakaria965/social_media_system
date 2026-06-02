import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { SocialAccount } from "@/lib/models/account"
import { ActivityLog } from "@/lib/models/activity"
import { getActiveWorkspaceId } from "@/lib/workspaces"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email.toLowerCase().trim()
    const workspaceId = await getActiveWorkspaceId(email, request)

    const accounts = await SocialAccount.find({ workspaceId }).sort({ createdAt: -1 }).lean()

    return NextResponse.json({ accounts })
  } catch (err: any) {
    console.error("GET /api/settings/channels error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email.toLowerCase().trim()
    const workspaceId = await getActiveWorkspaceId(email, request)
    const body = await request.json()
    const { action, platform, accountId } = body

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    // 1. Connect / Reconnect mock social platform
    if (action === "connect" || action === "reconnect") {
      if (!platform) {
        return NextResponse.json({ error: "Platform name is required" }, { status: 400 })
      }

      // Check if it's already connected
      let account = await SocialAccount.findOne({ workspaceId, platform })

      const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
      const username = `GrowWave ${capitalize(platform)} Sandbox`
      const mockToken = "EAAhk_" + Math.random().toString(36).substring(2, 15)

      if (account) {
        account.status = "connected"
        account.username = username
        account.accessToken = mockToken
        account.tokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
        await account.save()
      } else {
        account = await SocialAccount.create({
          userId: email,
          workspaceId,
          platform,
          username,
          avatar: "",
          accessToken: mockToken,
          status: "connected",
          followers: Math.floor(Math.random() * 8000) + 1200,
          engagement: parseFloat((Math.random() * 4 + 1.2).toFixed(1)),
          tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        })
      }

      // Log in ActivityLog
      await ActivityLog.create({
        userId: email,
        workspaceId,
        action: action === "connect" ? "connect_channel" : "reconnect_channel",
        details: `${action === "connect" ? "Connected" : "Reconnected"} social platform account: ${capitalize(platform)} (${username}).`,
        platform,
        status: "success",
      })

      return NextResponse.json({ success: true, account })
    }

    // 2. Refresh social platform API status
    if (action === "refresh") {
      if (!accountId) {
        return NextResponse.json({ error: "Social account ID is required" }, { status: 400 })
      }

      const account = await SocialAccount.findOne({ _id: accountId, workspaceId })
      if (!account) {
        return NextResponse.json({ error: "Social account not found" }, { status: 404 })
      }

      account.status = "connected"
      account.tokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      account.followers += Math.floor(Math.random() * 45) + 5
      account.engagement = parseFloat((account.engagement + (Math.random() * 0.4 - 0.2)).toFixed(1))
      await account.save()

      await ActivityLog.create({
        userId: email,
        workspaceId,
        action: "refresh_channel",
        details: `Refreshed integration synchronization credentials for ${account.platform.toUpperCase()} (${account.username}).`,
        platform: account.platform,
        status: "success",
      })

      return NextResponse.json({ success: true, account })
    }

    // 3. Disconnect social platform
    if (action === "disconnect") {
      if (!accountId) {
        return NextResponse.json({ error: "Social account ID is required" }, { status: 400 })
      }

      const account = await SocialAccount.findOne({ _id: accountId, workspaceId })
      if (!account) {
        return NextResponse.json({ error: "Social account not found" }, { status: 404 })
      }

      const platformName = account.platform
      const username = account.username

      await SocialAccount.deleteOne({ _id: accountId, workspaceId })

      await ActivityLog.create({
        userId: email,
        workspaceId,
        action: "disconnect_channel",
        details: `Disconnected social platform account: ${platformName.toUpperCase()} (${username}).`,
        platform: platformName,
        status: "success",
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action specified" }, { status: 400 })
  } catch (err: any) {
    console.error("POST /api/settings/channels error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
