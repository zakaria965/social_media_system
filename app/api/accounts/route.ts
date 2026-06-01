import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { SocialAccount } from "@/lib/models/account"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Automatic Sandbox seeding: If no facebook account is connected, and standard access token is configured in env
    const hasFacebook = await SocialAccount.findOne({
      userId: session.user.email,
      platform: "facebook",
    })

    if (!hasFacebook && process.env._ACCESS_TOKEN) {
      await SocialAccount.create({
        userId: session.user.email,
        platform: "facebook",
        accessToken: process.env._ACCESS_TOKEN,
        platformAccountId: process.env.FACEBOOK_page_id || "1094354963758763",
        username: "GrowWave Sandbox Page",
        avatar: "",
        status: "connected",
        followers: 2450,
        engagement: 4.2,
      })
    }

    const accounts = await SocialAccount.find({ userId: session.user.email }).sort({ createdAt: -1 }).lean()

    return NextResponse.json({ accounts })
  } catch (err: unknown) {
    console.error("GET /api/accounts error:", err)
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
    const body = await request.json()
    const { platform, accessToken, refreshToken, tokenExpiresAt, platformAccountId, username, avatar } = body

    if (!platform || !accessToken) {
      return NextResponse.json({ error: "Platform and accessToken are required" }, { status: 400 })
    }

    const existing = await SocialAccount.findOne({
      userId: session.user.email,
      platform,
    })

    if (existing) {
      existing.accessToken = accessToken
      if (refreshToken) existing.refreshToken = refreshToken
      if (tokenExpiresAt) existing.tokenExpiresAt = new Date(tokenExpiresAt)
      if (platformAccountId) existing.platformAccountId = platformAccountId
      if (username) existing.username = username
      if (avatar) existing.avatar = avatar
      existing.status = "connected"
      await existing.save()
      return NextResponse.json({ account: existing })
    }

    const account = await SocialAccount.create({
      userId: session.user.email,
      platform,
      accessToken,
      refreshToken: refreshToken || null,
      tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : null,
      platformAccountId: platformAccountId || "",
      username: username || "",
      avatar: avatar || "",
      status: "connected",
      followers: Math.floor(Math.random() * 3000) + 500,
      engagement: parseFloat((Math.random() * 4 + 1).toFixed(1)),
    })

    return NextResponse.json({ account }, { status: 201 })
  } catch (err: unknown) {
    console.error("POST /api/accounts error:", err)
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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 })
    }

    await SocialAccount.findOneAndDelete({ _id: id, userId: session.user.email })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error("DELETE /api/accounts error:", err)
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
