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

    const isFreePlan = session.user.plan === "FREE"
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    const errorRedirectBase = isFreePlan
      ? `${appUrl}/free-user/settings?tab=accounts`
      : `${appUrl}/dashboard/channels`

    if (error) {
      return NextResponse.redirect(`${errorRedirectBase}&error=${encodeURIComponent(error)}`)
    }

    if (!code) {
      return NextResponse.redirect(`${errorRedirectBase}&error=No+authorization+code+provided`)
    }

    const appId = process.env.FACEBOOK_APP_ID
    const appSecret = process.env.FACEBOOK_APP_SECRET
    const redirectUri = `${appUrl}/api/auth/facebook/callback`

    // Exchange code for user access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    )
    const tokenData = await tokenRes.json()

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Facebook OAuth exchange error:", tokenData)
      return NextResponse.redirect(`${errorRedirectBase}&error=Failed+to+exchange+Facebook+auth+code`)
    }

    const userAccessToken = tokenData.access_token

    // Redirect to settings / channels with selection trigger and token
    const successRedirect = isFreePlan
      ? `${appUrl}/free-user/settings?tab=accounts&select_facebook_page=true&token=${userAccessToken}`
      : `${appUrl}/dashboard/channels?select_facebook_page=true&token=${userAccessToken}`

    return NextResponse.redirect(successRedirect)
  } catch (err: unknown) {
    console.error("Facebook callback error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    
    const session = await getServerSession(authOptions)
    const isFreePlan = session?.user?.plan === "FREE"
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const errorRedirectBase = isFreePlan
      ? `${appUrl}/free-user/settings?tab=accounts`
      : `${appUrl}/dashboard/channels`

    return NextResponse.redirect(
      `${errorRedirectBase}?error=${encodeURIComponent(message)}`
    )
  }
}
