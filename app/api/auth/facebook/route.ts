import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { origin } = new URL(request.url)
    const appId = process.env.FACEBOOK_APP_ID

    if (!appId) {
      console.error("Missing FACEBOOK_APP_ID in environment variables")
      return NextResponse.json({ error: "Facebook configuration error: Missing FACEBOOK_APP_ID" }, { status: 500 })
    }

    const redirectUri = `${origin}/api/auth/facebook/callback`
    const permissions = [
      "pages_show_list",
      "pages_manage_posts",
      "pages_read_engagement",
      "business_management",
      "public_profile",
      "email"
    ].join(",")

    const authUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(permissions)}`

    return NextResponse.redirect(authUrl)
  } catch (err) {
    console.error("Facebook OAuth redirect error:", err)
    return NextResponse.json({ error: "Failed to generate authorization URL" }, { status: 500 })
  }
}
