import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { Media } from "@/lib/models/media"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const allowedTypes = [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PNG, JPG, JPEG, WEBP images and MP4, WEBM, MOV videos are allowed" },
        { status: 400 }
      )
    }

    // Support up to 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be under 50MB" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`

    const type = file.type.startsWith("video/") ? "video" : "image"

    await connectDB()
    const mediaItem = await Media.create({
      userId: session.user.email,
      name: file.name,
      url: base64,
      type,
      size: file.size,
    })

    return NextResponse.json({
      url: mediaItem.url,
      name: mediaItem.name,
      type: mediaItem.type,
      size: mediaItem.size,
      id: mediaItem._id,
    })
  } catch (err: unknown) {
    console.error("Upload error:", err)
    const message = err instanceof Error ? err.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
