import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { SidebarPreference } from "@/lib/models/sidebar-preference"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email

    const preferences = await SidebarPreference.findOne({ userId: email }).lean()
    
    return NextResponse.json({ preferences })
  } catch (err: unknown) {
    console.error("GET /api/user/sidebar-preferences error:", err)
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email
    const body = await request.json()
    const { structure, sectionsExpanded, isCollapsed } = body

    const preferences = await SidebarPreference.findOneAndUpdate(
      { userId: email },
      {
        $set: {
          structure,
          sectionsExpanded,
          isCollapsed,
        },
      },
      { new: true, upsert: true }
    )

    return NextResponse.json({ preferences })
  } catch (err: unknown) {
    console.error("POST /api/user/sidebar-preferences error:", err)
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

    await SidebarPreference.findOneAndDelete({ userId: email })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error("DELETE /api/user/sidebar-preferences error:", err)
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
