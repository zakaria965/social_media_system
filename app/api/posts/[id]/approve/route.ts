import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { Post } from "@/lib/models/post"
import { verifyMemberPermission, logWorkspaceActivity } from "@/lib/workspaces"

// POST: Approve post (Only Owner/Admin)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: postId } = await params
    await connectDB()

    const post = await Post.findById(postId)
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const workspaceId = post.workspaceId
    if (!workspaceId) {
      return NextResponse.json({ error: "Post is not linked to a workspace" }, { status: 400 })
    }

    // 1. Verify owner/admin role (they are the only ones allowed to approve)
    const check = await verifyMemberPermission(session.user.email, workspaceId, "team")
    if (!check.allowed || !["owner", "admin"].includes(check.role || "")) {
      return NextResponse.json({ error: "Forbidden: Only Owners or Admins can approve posts" }, { status: 403 })
    }

    // 2. Approve post
    post.approvalStatus = "approved"
    post.approvedOrRejectedBy = session.user.email
    post.approvalNotes = "Approved for publishing."
    await post.save()

    // 3. Log Activity
    await logWorkspaceActivity(
      workspaceId,
      session.user.email,
      "approve_post",
      `Approved post: "${post.title || post.content.slice(0, 20)}..."`
    )

    return NextResponse.json({ post, success: true })
  } catch (err: any) {
    console.error("POST /api/posts/[id]/approve error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}

// PATCH: Reject post (Only Owner/Admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: postId } = await params
    const { notes } = await request.json()

    await connectDB()

    const post = await Post.findById(postId)
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const workspaceId = post.workspaceId
    if (!workspaceId) {
      return NextResponse.json({ error: "Post is not linked to a workspace" }, { status: 400 })
    }

    // 1. Verify owner/admin role
    const check = await verifyMemberPermission(session.user.email, workspaceId, "team")
    if (!check.allowed || !["owner", "admin"].includes(check.role || "")) {
      return NextResponse.json({ error: "Forbidden: Only Owners or Admins can reject posts" }, { status: 403 })
    }

    // 2. Reject post
    post.approvalStatus = "rejected"
    post.approvedOrRejectedBy = session.user.email
    post.approvalNotes = notes || "Rejected during review."
    await post.save()

    // 3. Log Activity
    await logWorkspaceActivity(
      workspaceId,
      session.user.email,
      "reject_post",
      `Rejected post: "${post.title || post.content.slice(0, 20)}..."`
    )

    return NextResponse.json({ post, success: true })
  } catch (err: any) {
    console.error("PATCH /api/posts/[id]/approve error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}

// PUT: Request review (Anyone with posts permission)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: postId } = await params
    const { notes } = await request.json()
    await connectDB()

    const post = await Post.findById(postId)
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const workspaceId = post.workspaceId
    if (!workspaceId) {
      return NextResponse.json({ error: "Post is not linked to a workspace" }, { status: 400 })
    }

    // 1. Verify posts permission
    const check = await verifyMemberPermission(session.user.email, workspaceId, "posts")
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }

    // 2. Request review
    post.approvalStatus = "pending_review"
    post.approvalRequestedBy = session.user.email
    post.approvalNotes = notes || "Pending admin review."
    await post.save()

    // 3. Log Activity
    await logWorkspaceActivity(
      workspaceId,
      session.user.email,
      "request_review",
      `Requested review for post: "${post.title || post.content.slice(0, 20)}..."`
    )

    return NextResponse.json({ post, success: true })
  } catch (err: any) {
    console.error("PUT /api/posts/[id]/approve error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
