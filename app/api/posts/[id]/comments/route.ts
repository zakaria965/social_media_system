import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { Post } from "@/lib/models/post"
import { InternalComment } from "@/lib/models/comment"
import { WorkspaceMember } from "@/lib/models/workspace-member"
import { verifyMemberPermission, logWorkspaceActivity } from "@/lib/workspaces"

export async function GET(
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

    // 1. Verify caller has posts permission
    const check = await verifyMemberPermission(session.user.email, workspaceId, "posts")
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }

    // 2. Fetch comments
    const comments = await InternalComment.find({ postId }).sort({ createdAt: 1 }).lean()

    return NextResponse.json({ comments })
  } catch (err: any) {
    console.error("GET /api/posts/[id]/comments error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}

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
    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
    }

    await connectDB()

    const post = await Post.findById(postId)
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const workspaceId = post.workspaceId
    if (!workspaceId) {
      return NextResponse.json({ error: "Post is not linked to a workspace" }, { status: 400 })
    }

    // 1. Verify caller has posts permission
    const check = await verifyMemberPermission(session.user.email, workspaceId, "posts")
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }

    const callerMember = check.member

    // 2. Create comment
    const comment = await InternalComment.create({
      postId,
      workspaceId,
      authorEmail: session.user.email,
      authorName: callerMember.name || session.user.name || session.user.email.split("@")[0],
      authorAvatar: callerMember.avatar || session.user.image || "",
      content: content.trim(),
    })

    // 3. Log Activity
    await logWorkspaceActivity(
      workspaceId,
      session.user.email,
      "comment_post",
      `Added feedback comment on post "${post.title || post.content.slice(0, 20)}..."`
    )

    return NextResponse.json({ comment }, { status: 201 })
  } catch (err: any) {
    console.error("POST /api/posts/[id]/comments error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
