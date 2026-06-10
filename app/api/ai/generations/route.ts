import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/user"
import { AIGeneration } from "@/lib/models/ai-generation"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email.toLowerCase().trim()
    const dbUser = await User.findOne({ email }).select("_id")
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const items = await AIGeneration.find({ userId: dbUser._id.toString() })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean()

    return NextResponse.json({ generations: items })
  } catch (err: unknown) {
    console.error("GET /api/ai/generations error:", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
