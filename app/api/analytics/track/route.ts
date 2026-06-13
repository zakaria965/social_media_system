import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { ActivityLog } from "@/lib/models/activity"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const { action, details } = await request.json()

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    const log = await ActivityLog.create({
      userId: session.user.email,
      workspaceId: null,
      action,
      details: details || `Tracked event: ${action}`,
      status: "info"
    })

    return NextResponse.json({ success: true, log })
  } catch (err: any) {
    console.error("Tracking API error:", err)
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 })
  }
}
