import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { SocialAccount, type SocialPlatform } from "@/lib/models/account"
import { Post } from "@/lib/models/post"
import { ActivityLog } from "@/lib/models/activity"
import { publisherMap } from "@/lib/publisher"
import { User } from "@/lib/models/user"
import { PublishedPost } from "@/lib/models/published-post"
import { WorkspaceMember } from "@/lib/models/workspace-member"
import { Workspace } from "@/lib/models/workspace"
import { getActiveWorkspaceId } from "@/lib/workspaces"

interface PublishResult {
  success: boolean
  error?: string
}

interface PublishBody {
  postId?: string
  content: string
  platforms: string[]
  media: string[]
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const body: PublishBody = await request.json()
    const { postId, content, platforms, media } = body

    const dbUser = await User.findOne({ email: session.user.email })
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const workspaceId = await getActiveWorkspaceId(session.user.email, request)
    if (!workspaceId) {
      return NextResponse.json({ error: "Active workspace not found" }, { status: 400 })
    }

    const member = await WorkspaceMember.findOne({
      workspaceId,
      email: session.user.email,
      status: "active",
    })

    if (!member) {
      return NextResponse.json({ error: "You are not an active member of this workspace" }, { status: 403 })
    }

    // Normalize roles as done in lib/workspaces.ts
    let role = member.role
    if (role === "owner") role = "Workspace Owner";
    if (role === "admin") role = "Admin";
    if (role === "editor") role = "Content Manager";
    if (role === "viewer") role = "Analyst";

    const allowedRoles = ["Workspace Owner", "Admin", "Content Manager"]
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({
        error: "ROLE_UNAUTHORIZED",
        message: "Your role does not have permission to publish directly."
      }, { status: 403 })
    }

    const workspace = await Workspace.findById(workspaceId)
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const ownerEmail = workspace.ownerEmail || session.user.email
    const ownerUser = await User.findOne({ email: ownerEmail })
    const ownerPlan = (ownerUser?.plan || "FREE").toUpperCase()

    if (ownerPlan === "FREE") {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)

      const count = await PublishedPost.countDocuments({
        workspaceId: workspace._id.toString(),
        publishedAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      })

      if (count >= 3) {
        return NextResponse.json({ error: "PUBLISH_LIMIT_REACHED", message: "You have reached your daily publishing limit." }, { status: 403 })
      }
    }

    if (!content || !platforms || platforms.length === 0) {
      return NextResponse.json({ error: "Content and platforms are required" }, { status: 400 })
    }

    const accounts = await SocialAccount.find({
      userId: session.user.email,
      platform: { $in: platforms as SocialPlatform[] },
      status: "connected" as const,
    })

    const results: Record<string, PublishResult> = {}
    let allFailed = true
    let fbMetadata: any = null

    for (const platform of platforms) {
      const account = accounts.find((a) => a.platform === platform)
      if (!account) {
        results[platform] = { success: false, error: `No connected account for ${platform}` }
        await ActivityLog.create({
          userId: session.user.email,
          action: "publish_post",
          details: `Attempted to publish to ${platform} but no active connection was found.`,
          platform,
          status: "failed",
        })
        continue
      }

      try {
        const publisher = publisherMap[platform]
        if (!publisher) {
          results[platform] = { success: false, error: `Unsupported platform: ${platform}` }
          continue
        }

        const pubRes = await publisher(content, media || [], account.accessToken, account.platformAccountId)
        results[platform] = { success: true }
        allFailed = false

        const workspaceId = await getActiveWorkspaceId(session.user.email, request)
        const socialPostId = pubRes ? (pubRes.post_id || pubRes.id || pubRes.urn || null) : null
        await PublishedPost.create({
          userId: dbUser._id.toString(),
          workspaceId: workspaceId ? workspaceId.toString() : null,
          postId: postId || null,
          channel: platform,
          platform: platform,
          content: content,
          mediaUrls: media || [],
          status: "published",
          socialPostId: socialPostId ? String(socialPostId) : null,
          publishedAt: new Date()
        })

        if (platform === "facebook" && pubRes) {
          const fbPostId = (pubRes as any).post_id || (pubRes as any).id
          if (fbPostId) {
            try {
              const detailRes = await fetch(
                `https://graph.facebook.com/v22.0/${fbPostId}?fields=created_time,permalink_url,from{name}&access_token=${account.accessToken}`
              )
              if (detailRes.ok) {
                const detailData = await detailRes.json()
                fbMetadata = {
                  facebookPostId: fbPostId,
                  facebookUrl: detailData.permalink_url || `https://facebook.com/${fbPostId}`,
                  facebookPageName: detailData.from?.name || "GrowWave Sandbox Page",
                  facebookPublishedTime: detailData.created_time ? new Date(detailData.created_time) : new Date(),
                }
              } else {
                fbMetadata = {
                  facebookPostId: fbPostId,
                  facebookUrl: `https://facebook.com/${fbPostId}`,
                  facebookPageName: "GrowWave Sandbox Page",
                  facebookPublishedTime: new Date(),
                }
              }
            } catch (metaErr) {
              console.error("Meta detail fetch error:", metaErr)
              fbMetadata = {
                facebookPostId: fbPostId,
                facebookUrl: `https://facebook.com/${fbPostId}`,
                facebookPageName: "GrowWave Sandbox Page",
                facebookPublishedTime: new Date(),
              }
            }
          }
        }

        await ActivityLog.create({
          userId: session.user.email,
          action: "publish_post",
          details: `Successfully published post content ("${content.slice(0, 30)}...") to ${platform}`,
          platform,
          status: "success",
        })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error"
        results[platform] = { success: false, error: message }
        
        let finalStatus: "error" | "expired" = "error"
        if (message.includes("190") || message.includes("463") || message.toLowerCase().includes("expire")) {
          finalStatus = "expired"
        }
        
        await SocialAccount.updateOne(
          { _id: account._id },
          { $set: { status: finalStatus } }
        )
        await ActivityLog.create({
          userId: session.user.email,
          action: "publish_post",
          details: `Failed to publish to ${platform}: ${message}`,
          platform,
          status: "failed",
        })
      }
    }

    if (postId) {
      const updateData: Record<string, unknown> = {
        status: allFailed ? "failed" : "published",
        publishedAt: new Date(),
      }
      if (allFailed) {
        updateData.errorMessage = Object.values(results)
          .filter((r) => r.error)
          .map((r) => r.error)
          .join("; ")
      }
      if (fbMetadata) {
        Object.assign(updateData, fbMetadata)
      }
      await Post.findByIdAndUpdate(postId, { $set: updateData })
    }

    return NextResponse.json({ results })
  } catch (err: unknown) {
    console.error("Publish API error:", err)
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const dbUser = await User.findOne({ email: session.user.email })
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const count = await PublishedPost.countDocuments({
      $or: [
        { userId: dbUser._id.toString() },
        { userId: dbUser.email }
      ],
      publishedAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })

    return NextResponse.json({ count, plan: dbUser.plan || "FREE" })
  } catch (err: unknown) {
    console.error("GET /api/publish count error:", err)
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
