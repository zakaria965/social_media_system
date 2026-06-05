import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { Idea } from "@/lib/models/idea"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const items = await Idea.find({ userId: session.user.email }).sort({ createdAt: -1 }).lean()
    return NextResponse.json({ ideas: items })
  } catch (err: unknown) {
    console.error("GET /api/ideas error:", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, platform, media, status } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    await connectDB()
    const newItem = await Idea.create({
      userId: session.user.email,
      workspaceId: null,
      title,
      content: content || "",
      platform: platform || "facebook",
      media: media || null,
      status: status || "idea",
    })

    return NextResponse.json({ idea: newItem })
  } catch (err: unknown) {
    console.error("POST /api/ideas error:", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, content, platform, media, status } = body

    if (!id) {
      return NextResponse.json({ error: "Idea ID is required" }, { status: 400 })
    }

    await connectDB()
    const updatedItem = await Idea.findOneAndUpdate(
      { _id: id, userId: session.user.email },
      {
        title,
        content,
        platform,
        media,
        status,
      },
      { new: true }
    )

    if (!updatedItem) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 })
    }

    return NextResponse.json({ idea: updatedItem })
  } catch (err: unknown) {
    console.error("PUT /api/ideas error:", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Idea ID is required" }, { status: 400 })
    }

    await connectDB()
    const item = await Idea.findOneAndDelete({ _id: id, userId: session.user.email })

    if (!item) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error("DELETE /api/ideas error:", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
