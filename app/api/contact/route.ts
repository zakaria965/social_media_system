import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { ContactMessage } from "@/lib/models/contact-message"
import { AdminNotification } from "@/lib/models/admin-notification"

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { firstName, lastName, email, phone, subject, message } = body

    // Simple validation
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields: firstName, lastName, email, subject, message" },
        { status: 400 }
      )
    }

    // Create the contact message
    const newMessage = await ContactMessage.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || undefined,
      subject: subject.trim(),
      message: message.trim(),
      status: "New"
    })

    // Automatically create an admin notification
    await AdminNotification.create({
      type: "contact_message",
      title: "New Contact Message",
      message: `${firstName.trim()} ${lastName.trim()} sent a contact request`,
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
