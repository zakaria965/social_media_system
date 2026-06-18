import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { ContactMessage } from "@/lib/models/contact-message"
import { AdminNotification } from "@/lib/models/admin-notification"

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { fullName, email, subject, message } = body

    // Simple validation
    if (!fullName?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields: fullName, email, subject, message" },
        { status: 400 }
      )
    }

    // Split full name into firstName and lastName for schema compatibility
    const nameParts = fullName.trim().split(/\s+/)
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || " "

    // Create the contact message
    const newMessage = await ContactMessage.create({
      firstName,
      lastName,
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      status: "NEW"
    })

    // Automatically create an admin notification
    await AdminNotification.create({
      type: "contact_message",
      title: "New Contact Message Received",
      message: `From: ${firstName} ${lastName}\nSubject: ${subject}`,
      contactMessageId: newMessage._id,
      read: false
    })

    return NextResponse.json(
      { 
        success: true, 
        message: "Message sent successfully", 
        messageId: newMessage._id 
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error("POST /api/contact error:", err)
    return NextResponse.json(
      { error: err.message || "An error occurred while sending the message" },
      { status: 500 }
    )
  }
}
