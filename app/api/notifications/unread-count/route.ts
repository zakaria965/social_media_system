import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { UserNotification } from "@/lib/models/notification"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email.toLowerCase()

    const unreadCount = await UserNotification.countDocuments({
      userId: email,
      read: false,
    })

    return NextResponse.json({ unreadCount })
  } catch (err: any) {
    console.error("GET /api/notifications/unread-count error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to fetch unread count" },
      { status: 500 }
    )
  }
}
