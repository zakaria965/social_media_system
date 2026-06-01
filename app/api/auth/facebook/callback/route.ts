import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { SocialAccount } from "@/lib/models/account"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(`${origin}/dashboard/channels?error=${encodeURIComponent(error)}`)
    }

    if (!code) {
      return NextResponse.redirect(`${origin}/dashboard/channels?error=No+authorization+code+provided`)
    }

    const appId = process.env.FACEBOOK_APP_ID
    const appSecret = process.env.FACEBOOK_APP_SECRET
    const redirectUri = `${origin}/api/auth/facebook/callback`

    // Exchange code for user access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    )
    const tokenData = await tokenRes.json()

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Facebook OAuth exchange error:", tokenData)
      return NextResponse.redirect(`${origin}/dashboard/channels?error=Failed+to+exchange+Facebook+auth+code`)
    }

    const userAccessToken = tokenData.access_token

    // Redirect to channels with selection trigger and token
    return NextResponse.redirect(
      `${origin}/dashboard/channels?select_facebook_page=true&token=${userAccessToken}`
    )
  } catch (err: unknown) {
    console.error("Facebook callback error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.redirect(
      `${new URL(request.url).origin}/dashboard/channels?error=${encodeURIComponent(message)}`
    )
  }
}
