import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Post } from "@/lib/models/post"
import { ActivityLog } from "@/lib/models/activity"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { QueueJob } from "@/lib/models/queue"
import { getActiveWorkspaceId, verifyMemberPermission, logWorkspaceActivity } from "@/lib/workspaces"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const workspaceId = await getActiveWorkspaceId(session.user.email, request)

    // Verify dashboard permission
    const check = await verifyMemberPermission(session.user.email, workspaceId, "dashboard")
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      const post = await Post.findOne({ _id: id, workspaceId }).lean()
      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 })
      }
      
      const jobs = await QueueJob.find({ postId: post._id }).lean()
      const retryCount = jobs.reduce((sum, j) => Math.max(sum, j.retryCount || 0), 0)
      const lastJob = jobs.length > 0 ? [...jobs].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0] : null

      return NextResponse.json({
        post: {
          ...post,
          retryCount,
          lastAttempt: lastJob ? lastJob.updatedAt : null,
          executionLogs: lastJob ? lastJob.executionLogs : [],
          jobsStatus: jobs.map((j) => ({ platform: j.platform, status: j.status, retryCount: j.retryCount })),
        },
      })
    }

    const status = searchParams.get("status")
    const filter: Record<string, unknown> = { workspaceId }
    if (status && ["draft", "scheduled", "publishing", "published", "failed", "cancelled"].includes(status)) {
      filter.status = status
    }

    const posts = await Post.find(filter).sort({ createdAt: -1 }).lean()

    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const jobs = await QueueJob.find({ postId: post._id }).lean()
        const retryCount = jobs.reduce((sum, j) => Math.max(sum, j.retryCount || 0), 0)
        const lastJob = jobs.length > 0 ? [...jobs].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0] : null

        return {
          ...post,
          retryCount,
          lastAttempt: lastJob ? lastJob.updatedAt : null,
          executionLogs: lastJob ? lastJob.executionLogs : [],
          jobsCount: jobs.length,
          jobsStatus: jobs.map((j) => ({ platform: j.platform, status: j.status, retryCount: j.retryCount })),
        }
      })
    )

    return NextResponse.json({ posts: enrichedPosts })
  } catch (err: unknown) {
    console.error("GET /api/posts error:", err)
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
    const workspaceId = await getActiveWorkspaceId(session.user.email, request)

    // Verify post creation permissions
    const check = await verifyMemberPermission(session.user.email, workspaceId, "posts")
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }

    const body = await request.json()
    const { content, platforms, media, hashtags, status, scheduledAt, title, type } = body

    if (!content && status !== "draft") {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    if ((status === "published" || status === "scheduled" || status === "publishing") && (!platforms || platforms.length === 0)) {
      return NextResponse.json({ error: "At least one platform is required" }, { status: 400 })
    }

    // Role Enforcement / Approval Workflow trigger:
    // If the role is Editor or Custom and doesn't have owner/admin rights, they cannot schedule or publish directly.
    // They must request review, and the post status is set as draft/pending review.
    const isOwnerOrAdmin = ["owner", "admin"].includes(check.role || "")
    let finalStatus = status || "draft"
    let approvalStatus: "none" | "pending_review" | "approved" | "rejected" = "none"

    if (!isOwnerOrAdmin && (finalStatus === "scheduled" || finalStatus === "published" || finalStatus === "publishing")) {
      // Force draft status and flag as pending review
      finalStatus = "draft"
      approvalStatus = "pending_review"
    }

    const post = await Post.create({
      userId: session.user.email,
      workspaceId,
      title: title || "",
      content: content || "",
      platforms: platforms || [],
      media: media || [],
      hashtags: hashtags || [],
      status: finalStatus,
      type: type || "text",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      approvalStatus,
      approvalRequestedBy: approvalStatus === "pending_review" ? session.user.email : null,
    })

    // Log this action to the ActivityLog
    let details = ""
    let action = "create_post"

    if (approvalStatus === "pending_review") {
      details = `Created draft post: "${post.title || post.content.slice(0, 30)}..." and submitted for Admin approval.`
      action = "request_review"
    } else if (post.status === "draft") {
      details = `Created draft: "${post.title || post.content.slice(0, 30)}..."`
    } else if (post.status === "scheduled") {
      details = `Scheduled post: "${post.title || post.content.slice(0, 30)}..." for ${post.platforms.join(", ")}`
    } else if (post.status === "published") {
      details = `Successfully published post: "${post.title || post.content.slice(0, 30)}..."`
      action = "publish_post"
    } else {
      details = `Saved post: "${post.title || post.content.slice(0, 30)}..."`
    }

    await logWorkspaceActivity(
      workspaceId,
      session.user.email,
      action,
      details,
      post.platforms.length > 0 ? post.platforms[0] : null
    )

    return NextResponse.json({ post }, { status: 201 })
  } catch (err: unknown) {
    console.error("POST /api/posts error:", err)
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const workspaceId = await getActiveWorkspaceId(session.user.email, request)

    // Verify post permission
    const check = await verifyMemberPermission(session.user.email, workspaceId, "posts")
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // Secure workspace isolating check
    const post = await Post.findOneAndUpdate(
      { _id: id, workspaceId },
      { $set: updates },
      { new: true }
    )

    if (!post) {
      return NextResponse.json({ error: "Post not found in active workspace" }, { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (err: unknown) {
    console.error("PATCH /api/posts error:", err)
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
    const workspaceId = await getActiveWorkspaceId(session.user.email, request)

    // Verify delete permissions
    const check = await verifyMemberPermission(session.user.email, workspaceId, "posts")
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // Secure workspace isolation deletion check
    const post = await Post.findOneAndDelete({ _id: id, workspaceId })

    if (!post) {
      return NextResponse.json({ error: "Post not found in active workspace" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error("DELETE /api/posts error:", err)
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
