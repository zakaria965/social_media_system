import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { QueueJob } from "@/lib/models/queue"
import { Post } from "@/lib/models/post"
import { SocialAccount } from "@/lib/models/account"
import { ActivityLog } from "@/lib/models/activity"
import { Notification } from "@/lib/models/notification"
import { publisherMap } from "@/lib/publisher"
import { User } from "@/lib/models/user"
import { PublishedPost } from "@/lib/models/published-post"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const query: Record<string, any> = {}

    if (status && status !== "all") {
      query.status = status
    }

    // Populate post details so the monitor can show post metadata
    const jobs = await QueueJob.find(query)
      .populate({
        path: "postId",
        model: Post,
      })
      .sort({ runAt: 1 })
      .lean()

    // Aggregate system health stats
    const totalJobs = await QueueJob.countDocuments()
    const pendingJobs = await QueueJob.countDocuments({ status: "pending" })
    const runningJobs = await QueueJob.countDocuments({ status: "running" })
    const completedJobs = await QueueJob.countDocuments({ status: "completed" })
    const failedJobs = await QueueJob.countDocuments({ status: "failed" })
    const retryingJobs = await QueueJob.countDocuments({ status: "retrying" })

    return NextResponse.json({
      jobs,
      stats: {
        total: totalJobs,
        pending: pendingJobs,
        running: runningJobs,
        completed: completedJobs,
        failed: failedJobs,
        retrying: retryingJobs,
        healthScore: totalJobs > 0 ? Math.round(((completedJobs + pendingJobs + retryingJobs) / totalJobs) * 100) : 100,
      },
    })
  } catch (err: unknown) {
    console.error("GET /api/queue error:", err)
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
    const { jobId } = body

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    const job = await QueueJob.findById(jobId)
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const post = await Post.findById(job.postId)
    if (!post) {
      return NextResponse.json({ error: "Associated post not found" }, { status: 404 })
    }

    // Set state to running
    job.status = "running"
    job.executionLogs.push({
      timestamp: new Date(),
      message: `Manual trigger execution started by ${session.user.email}`,
      status: "running",
    })
    await job.save()

    post.status = "publishing"
    await post.save()

    try {
      const account = await SocialAccount.findOne({
        userId: post.userId,
        platform: job.platform as any,
      })

      if (!account) {
        throw new Error(`Connection error: No connected account for ${job.platform}`)
      }

      if (account.status !== "connected") {
        throw new Error(`Connection error: ${job.platform} account connection is unhealthy (${account.status})`)
      }

      const dbUser = await User.findOne({ email: post.userId })
      if (dbUser && (dbUser.plan || "FREE").toUpperCase() === "FREE") {
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

        if (count >= 3) {
          job.status = "failed"
          job.executionLogs.push({
            timestamp: new Date(),
            message: `Execution blocked: daily publishing limit reached`,
            status: "failed",
          })
          await job.save()

          post.status = "failed"
          post.errorMessage = "Daily publishing limit reached"
          await post.save()

          return NextResponse.json({ error: "PUBLISH_LIMIT_REACHED", message: "You have reached your daily publishing limit." }, { status: 403 })
        }
      }

      const publisher = publisherMap[job.platform]
      if (!publisher) {
        throw new Error(`Unsupported platform: ${job.platform}`)
      }

      const pubRes = await publisher(
        post.content,
        post.media || [],
        account.accessToken,
        account.platformAccountId
      )

      job.status = "completed"
      job.executionLogs.push({
        timestamp: new Date(),
        message: `Manual trigger execution completed successfully`,
        status: "completed",
      })
      await job.save()

      if (dbUser) {
        await PublishedPost.create({
          userId: dbUser._id.toString(),
          workspaceId: post.workspaceId ? post.workspaceId.toString() : null,
          postId: post._id.toString(),
          channel: job.platform,
          publishedAt: new Date()
        })
      }

      // Metadata sync
      const fbMetadata: Record<string, any> = {}
      if (job.platform === "facebook" && pubRes) {
        const fbPostId = pubRes.post_id || pubRes.id
        if (fbPostId) {
          try {
            const detailRes = await fetch(
              `https://graph.facebook.com/v22.0/${fbPostId}?fields=created_time,permalink_url,from{name}&access_token=${account.accessToken}`
            )
            if (detailRes.ok) {
              const detailData = await detailRes.json()
              fbMetadata.facebookPostId = fbPostId
              fbMetadata.facebookUrl = detailData.permalink_url || `https://facebook.com/${fbPostId}`
              fbMetadata.facebookPageName = detailData.from?.name || account.username || "GrowWave Page"
              fbMetadata.facebookPublishedTime = detailData.created_time
                ? new Date(detailData.created_time)
                : new Date()
            }
          } catch {}
        }
      }

      const allJobs = await QueueJob.find({ postId: post._id })
      const allCompleted = allJobs.every((j) => j.status === "completed")

      const updateFields: Record<string, any> = {
        status: allCompleted ? "published" : "publishing",
        publishedAt: new Date(),
      }
      if (Object.keys(fbMetadata).length > 0) {
        Object.assign(updateFields, fbMetadata)
      }

      await Post.findByIdAndUpdate(post._id, { $set: updateFields })

      await ActivityLog.create({
        userId: post.userId,
        action: "publish_post",
        details: `Manually triggered automatic publishing success to ${job.platform}`,
        platform: job.platform,
        status: "success",
      })

      await Notification.create({
        userId: post.userId,
        title: "Post Published Successfully",
        message: `Your post was manually triggered and published successfully to ${job.platform}.`,
        type: "success",
      })

      return NextResponse.json({ success: true, job })
    } catch (err: any) {
      const errorMsg = err.message || "Manual run error"
      job.status = "failed"
      job.executionLogs.push({
        timestamp: new Date(),
        message: `Manual run failed: ${errorMsg}`,
        status: "failed",
      })
      await job.save()

      post.status = "failed"
      post.errorMessage = `Manual run failed on ${job.platform}: ${errorMsg}`
      await post.save()

      await ActivityLog.create({
        userId: post.userId,
        action: "publish_post",
        details: `Manually triggered automatic publishing failed on ${job.platform}: ${errorMsg}`,
        platform: job.platform,
        status: "failed",
      })

      await Notification.create({
        userId: post.userId,
        title: "Manual Publishing Failed",
        message: `Your manually triggered post failed to publish to ${job.platform}: ${errorMsg}`,
        type: "error",
      })

      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }
  } catch (err: unknown) {
    console.error("POST /api/queue trigger error:", err)
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
    const jobId = searchParams.get("jobId")

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    const job = await QueueJob.findById(jobId)
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const post = await Post.findById(job.postId)
    if (post) {
      post.status = "cancelled"
      await post.save()

      await Notification.create({
        userId: post.userId,
        title: "Publish Schedule Cancelled",
        message: `The schedule for post "${post.title || post.content.slice(0, 30)}..." has been cancelled.`,
        type: "info",
      })

      await ActivityLog.create({
        userId: post.userId,
        action: "cancel_schedule",
        details: `Cancelled scheduled publishing for: "${post.title || post.content.slice(0, 30)}..."`,
        status: "success",
      })
    }

    // Set job status to failed/cancelled
    job.status = "failed"
    job.executionLogs.push({
      timestamp: new Date(),
      message: `Job scheduling cancelled by ${session.user.email}`,
      status: "failed",
    })
    await job.save()

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error("DELETE /api/queue error:", err)
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
