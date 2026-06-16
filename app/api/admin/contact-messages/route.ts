import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { ContactMessage } from "@/lib/models/contact-message"
import { AdminNotification } from "@/lib/models/admin-notification"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "All"

    // Construct search query
    const query: any = {}

    if (status !== "All") {
      query.status = status
    }

    if (search) {
      const searchRegex = new RegExp(search, "i")
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { subject: searchRegex },
        { message: searchRegex }
      ]
    }

    // Fetch messages
    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .lean()

    // Fetch counts for KPIs
    const totalCount = await ContactMessage.countDocuments()
    const newCount = await ContactMessage.countDocuments({ status: "New" })
    const readCount = await ContactMessage.countDocuments({ status: "Read" })
    const repliedCount = await ContactMessage.countDocuments({ status: "Replied" })
    const archivedCount = await ContactMessage.countDocuments({ status: "Archived" })

    return NextResponse.json({
      messages,
      kpis: {
        total: totalCount,
        new: newCount,
        read: readCount,
        replied: repliedCount,
        archived: archivedCount
      }
    })
  } catch (err: any) {
    console.error("GET /api/admin/contact-messages error:", err)
    return NextResponse.json(
      { error: err.message || "An error occurred while fetching contact messages" },
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
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields: id, status" }, { status: 400 })
    }

    if (!["New", "Read", "Replied", "Archived"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    const updatedMessage = await ContactMessage.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    )

    if (!updatedMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // If marked read, replied, or archived, mark the related notification as read
    if (status !== "New") {
      await AdminNotification.updateMany(
        { contactMessageId: id },
        { $set: { read: true } }
      )
    }

    return NextResponse.json({ success: true, message: updatedMessage })
  } catch (err: any) {
    console.error("PATCH /api/admin/contact-messages error:", err)
    return NextResponse.json(
      { error: err.message || "An error occurred while updating the message status" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing query parameter: id" }, { status: 400 })
    }

    const deletedMessage = await ContactMessage.findByIdAndDelete(id)

    if (!deletedMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Clean up notifications associated with this message
    await AdminNotification.deleteMany({ contactMessageId: id })

    return NextResponse.json({ success: true, message: "Spam message and related notifications deleted" })
  } catch (err: any) {
    console.error("DELETE /api/admin/contact-messages error:", err)
    return NextResponse.json(
      { error: err.message || "An error occurred while deleting the message" },
      { status: 500 }
    )
  }
}
