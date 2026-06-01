import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { SocialAccount } from "@/lib/models/account"

interface HealthLog {
  platform: string
  accountId: string
  username: string
  status:
    | "connected"
    | "disconnected"
    | "expired"
    | "permission_error"
    | "sync_error"
    | "pending"
  message: string
  details?: unknown
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email

    // Load and audit environment configuration
    const envAudit = {
      appIdExists: !!process.env.FACEBOOK_APP_ID,
      appSecretExists: !!process.env.FACEBOOK_APP_SECRET,
      pageIdExists: !!(process.env.FACEBOOK_page_id || process.env.FACEBOOK_PAGE_ID),
      accessTokenExists: !!process.env._ACCESS_TOKEN,
    }

    const accounts = await SocialAccount.find({ userId: email })
    const logs: HealthLog[] = []

    for (const acc of accounts) {
      if (acc.platform === "facebook") {
        if (!acc.accessToken) {
          acc.status = "permission_error"
          await acc.save()
          logs.push({
            platform: "facebook",
            accountId: acc.platformAccountId,
            username: acc.username,
            status: "permission_error",
            message: "Missing page access token in database",
          })
          continue
        }

        try {
          // Perform real health check against Meta Graph API
          const verifyRes = await fetch(
            `https://graph.facebook.com/v22.0/${acc.platformAccountId}?fields=name,id&access_token=${acc.accessToken}`
          )
          const verifyData = await verifyRes.json()

          if (verifyRes.ok) {
            acc.status = "connected"
            await acc.save()
            logs.push({
              platform: "facebook",
              accountId: acc.platformAccountId,
              username: acc.username,
              status: "connected",
              message: "Connection verified and fully operational",
              details: verifyData,
            })
          } else {
            // Parse OAuth exception details
            const graphError = verifyData.error || {}
            let finalStatus: "expired" | "permission_error" | "sync_error" = "permission_error"
            let userMessage = "Permissions or permission scope error"

            if (graphError.code === 190) {
              const subcode = graphError.error_subcode
              if (subcode === 463 || subcode === 467 || String(graphError.message).toLowerCase().includes("expire")) {
                finalStatus = "expired"
                userMessage = "Access token expired. Please reconnect your page"
              } else {
                userMessage = `Authentication error: ${graphError.message || "Invalid signature or session"}`
              }
            } else {
              userMessage = `Graph API Error (${graphError.code}): ${graphError.message || "Unknown error"}`
            }

            acc.status = finalStatus
            await acc.save()
            logs.push({
              platform: "facebook",
              accountId: acc.platformAccountId,
              username: acc.username,
              status: finalStatus,
              message: userMessage,
              details: graphError,
            })
          }
        } catch (fetchErr: unknown) {
          const fetchMsg = fetchErr instanceof Error ? fetchErr.message : "Network request failed"
          acc.status = "permission_error"
          await acc.save()
          logs.push({
            platform: "facebook",
            accountId: acc.platformAccountId,
            username: acc.username,
            status: "permission_error",
            message: `Facebook API unreachable: ${fetchMsg}`,
          })
        }
      } else {
        // Non-facebook sandbox or mock health check integration
        logs.push({
          platform: acc.platform,
          accountId: acc.platformAccountId,
          username: acc.username,
          status: acc.status as any,
          message: `Active sandbox connection simulated`,
        })
      }
    }

    return NextResponse.json({
      success: true,
      envAudit,
      logs,
      accounts: await SocialAccount.find({ userId: email }).sort({ createdAt: -1 }).lean(),
    })
  } catch (err: unknown) {
    console.error("Health check route error:", err)
    const msg = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
