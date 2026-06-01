import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { ActivityLog } from "@/lib/models/activity"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email

    // Retrieve recent channel logs
    const logs = await ActivityLog.find({
      userId: email,
      $or: [
        { platform: { $ne: null } },
        { action: { $in: ["channel_connect", "channel_disconnect", "channel_sync", "publish_post"] } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean()

    return NextResponse.json({ logs })
  } catch (err: unknown) {
    console.error("GET /api/accounts/logs error:", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
