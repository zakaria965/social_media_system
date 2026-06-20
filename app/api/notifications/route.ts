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

    // Pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const skip = (page - 1) * limit

    const totalCount = await UserNotification.countDocuments({ userId: email })
    const totalPages = Math.ceil(totalCount / limit)

    // Fetch user-specific notifications populated with core announcement details
    const userNotifications = await UserNotification.find({ userId: email })
      .sort({ deliveredAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("notificationId")
      .lean()

    // Format the notifications to match the expected client layout structure
    const notifications = userNotifications
      .filter((un: any) => un.notificationId) // Filter out any orphan/deleted notification templates
      .map((un: any) => ({
        _id: un._id.toString(), // Client uses this id to toggle read status or delete
        title: un.notificationId.title,
        message: un.notificationId.message,
        type: un.notificationId.type || "info",
        read: un.read,
        createdAt: un.deliveredAt || un.notificationId.createdAt,
      }))

    return NextResponse.json({
      notifications,
      page,
      limit,
      totalPages,
      totalCount,
    })
  } catch (err: any) {
    console.error("GET /api/notifications error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email.toLowerCase()
    const body = await request.json()
    const { id, read = true } = body

    if (id) {
      // Mark a single specific user notification as read
      const updated = await UserNotification.findOneAndUpdate(
        { _id: id, userId: email },
        { $set: { read, readAt: read ? new Date() : undefined } },
        { new: true }
      ).populate("notificationId")

      if (!updated) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 })
      }

      const formatted = {
        _id: updated._id.toString(),
        title: (updated.notificationId as any).title,
        message: (updated.notificationId as any).message,
        type: (updated.notificationId as any).type || "info",
        read: updated.read,
        createdAt: updated.deliveredAt,
      }

      return NextResponse.json({ notification: formatted })
    } else {
      // Bulk mark all active notifications as read
      await UserNotification.updateMany(
        { userId: email, read: false },
        { $set: { read: true, readAt: new Date() } }
      )
      return NextResponse.json({ success: true })
    }
  } catch (err: any) {
    console.error("PATCH /api/notifications error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to update notification status" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email.toLowerCase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      // Delete a single notification (delete personal copy)
      await UserNotification.findOneAndDelete({ _id: id, userId: email })
    } else {
      // Clear all personal notifications
      await UserNotification.deleteMany({ userId: email })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("DELETE /api/notifications error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to delete notification(s)" },
      { status: 500 }
    )
  }
}
