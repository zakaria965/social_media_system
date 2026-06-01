import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { Notification } from "@/lib/models/notification"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email

    const notifications = await Notification.find({ userId: email })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    return NextResponse.json({ notifications })
  } catch (err: unknown) {
    console.error("GET /api/notifications error:", err)
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email
    const body = await request.json()
    const { id, read = true } = body

    if (id) {
      // Mark specific notification as read/unread
      const notification = await Notification.findOneAndUpdate(
        { _id: id, userId: email },
        { $set: { read } },
        { new: true }
      )
      return NextResponse.json({ notification })
    } else {
      // Mark all as read
      await Notification.updateMany({ userId: email, read: false }, { $set: { read: true } })
      return NextResponse.json({ success: true })
    }
  } catch (err: unknown) {
    console.error("PATCH /api/notifications error:", err)
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      await Notification.findOneAndDelete({ _id: id, userId: email })
    } else {
      await Notification.deleteMany({ userId: email })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error("DELETE /api/notifications error:", err)
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
