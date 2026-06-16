import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { AdminNotification } from "@/lib/models/admin-notification"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Fetch unread notifications
    const notifications = await AdminNotification.find({ read: false })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      notifications,
      unreadCount: notifications.length
    })
  } catch (err: any) {
    console.error("GET /api/admin/notifications error:", err)
    return NextResponse.json(
      { error: err.message || "An error occurred while fetching notifications" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { id, read = true } = body

    if (id) {
      // Mark specific notification as read
      const notification = await AdminNotification.findByIdAndUpdate(
        id,
        { $set: { read } },
        { new: true }
      )
      return NextResponse.json({ notification })
    } else {
      // Mark all as read
      await AdminNotification.updateMany({ read: false }, { $set: { read: true } })
      return NextResponse.json({ success: true })
    }
  } catch (err: any) {
    console.error("PATCH /api/admin/notifications error:", err)
    return NextResponse.json(
      { error: err.message || "An error occurred while updating notifications" },
      { status: 500 }
    )
  }
}
