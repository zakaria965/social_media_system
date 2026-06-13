import { connectDB } from "./db"
import { Post } from "./models/post"
import { SocialAccount } from "./models/account"
import { ActivityLog } from "./models/activity"
import { QueueJob } from "./models/queue"
import { Notification } from "./models/notification"
import { publisherMap } from "./publisher"
import { User } from "./models/user"
import { PublishedPost } from "./models/published-post"

let isChecking = false
let schedulerInterval: NodeJS.Timeout | null = null

export async function checkScheduleQueue() {
  if (isChecking) return
  isChecking = true

  try {
    await connectDB()
    const now = new Date()

    // 1. Scan for due scheduled posts (status: "scheduled" & scheduledAt <= now)
    // with no queue jobs yet. Create a QueueJob for each platform.
    const duePosts = await Post.find({
      status: "scheduled",
      scheduledAt: { $lte: now },
    })

    for (const post of duePosts) {
      const existingJobs = await QueueJob.find({ postId: post._id })
      if (existingJobs.length === 0 && post.platforms.length > 0) {
        const jobsToCreate = post.platforms.map((platform) => {
          const pubDate = post.scheduledAt
            ? post.scheduledAt.toISOString().split("T")[0]
            : now.toISOString().split("T")[0]
          const pubTime = post.scheduledAt
            ? post.scheduledAt.toTimeString().split(" ")[0].slice(0, 5)
            : now.toTimeString().split(" ")[0].slice(0, 5)

          return {
            postId: post._id,
            platform,
            publishDate: pubDate,
            publishTime: pubTime,
            retryCount: 0,
            status: "pending",
            runAt: post.scheduledAt || now,
            executionLogs: [
              {
                timestamp: new Date(),
                message: `Job initialized for platform ${platform} at scheduled time`,
                status: "pending",
              },
            ],
          }
        })

        await QueueJob.insertMany(jobsToCreate)

        // Notify user post scheduled queue started
        await Notification.create({
          userId: post.userId,
          title: "Post Scheduled Queue Started",
          message: `Your post "${post.title || post.content.slice(0, 30)}..." is queued for automatic publishing.`,
          type: "info",
        })

        await ActivityLog.create({
          userId: post.userId,
          action: "create_queue",
          details: `Queue created for post: "${post.title || post.content.slice(0, 30)}..."`,
          status: "success",
        })
      }
    }

    // 2. Fetch jobs that are due: status is "pending" or "retrying", and runAt <= now
    const eligibleJobs = await QueueJob.find({
      status: { $in: ["pending", "retrying"] },
      runAt: { $lte: now },
    })

    for (const job of eligibleJobs) {
      job.status = "running"
      job.executionLogs.push({
        timestamp: new Date(),
        message: `Execution attempt ${job.retryCount + 1} started.`,
        status: "running",
      })
      await job.save()

      const post = await Post.findById(job.postId)
      if (!post) {
        job.status = "failed"
        job.executionLogs.push({
          timestamp: new Date(),
          message: "Associated post record not found in database.",
          status: "failed",
        })
        await job.save()
        continue
      }

      // Update post status to "publishing"
      post.status = "publishing"
      await post.save()

      try {
        // Validate platform connection
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

        // Validate Facebook specific connections
        if (job.platform === "facebook") {
          if (!account.accessToken) {
            throw new Error("Expired or invalid token: Missing page access token")
          }
          if (!account.platformAccountId) {
            throw new Error("Missing Facebook Page connected account ID")
          }

          // Verify with Facebook API
          const verifyRes = await fetch(
            `https://graph.facebook.com/v22.0/${account.platformAccountId}?fields=name,id&access_token=${account.accessToken}`
          )
          if (!verifyRes.ok) {
            const errData = await verifyRes.json()
            const msg = errData.error?.message || "Verify Page API request failed"
            account.status = "expired"
            await account.save()

            await Notification.create({
              userId: post.userId,
              title: "Connection Error",
              message: `Facebook post failed due to an expired token for "${account.username}".`,
              type: "error",
            })

            throw new Error(`Expired token: Facebook verify request failed: ${msg}`)
          }
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
            throw new Error("Daily publishing limit reached")
          }
        }

        // Run publisher
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

        // Job succeeded!
        job.status = "completed"
        job.executionLogs.push({
          timestamp: new Date(),
          message: `Successfully published to ${job.platform}.`,
          status: "completed",
        })
        await job.save()

        if (dbUser) {
          const socialPostId = pubRes ? (pubRes.post_id || pubRes.id || pubRes.urn || null) : null
          await PublishedPost.create({
            userId: dbUser._id.toString(),
            workspaceId: post.workspaceId ? post.workspaceId.toString() : null,
            postId: post._id.toString(),
            channel: job.platform,
            platform: job.platform,
            content: post.content,
            mediaUrls: post.media || [],
            status: "published",
            socialPostId: socialPostId ? String(socialPostId) : null,
            publishedAt: new Date()
          })
        }

        // Handle Facebook metadata if applicable
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
              } else {
                fbMetadata.facebookPostId = fbPostId
                fbMetadata.facebookUrl = `https://facebook.com/${fbPostId}`
                fbMetadata.facebookPageName = account.username || "GrowWave Page"
                fbMetadata.facebookPublishedTime = new Date()
              }
            } catch {
              fbMetadata.facebookPostId = fbPostId
              fbMetadata.facebookUrl = `https://facebook.com/${fbPostId}`
              fbMetadata.facebookPageName = account.username || "GrowWave Page"
              fbMetadata.facebookPublishedTime = new Date()
            }
          }
        }

        // Check if all jobs for this post are finished
        const allJobs = await QueueJob.find({ postId: post._id })
        const allCompleted = allJobs.every(
          (j) => j.status === "completed" || j._id.equals(job._id)
        )

        const updateFields: Record<string, any> = {
          status: allCompleted ? "published" : "publishing",
          publishedAt: new Date(),
        }
        if (Object.keys(fbMetadata).length > 0) {
          Object.assign(updateFields, fbMetadata)
        }

        await Post.findByIdAndUpdate(post._id, { $set: updateFields })

        // Create successful Activity Log
        await ActivityLog.create({
          userId: post.userId,
          action: "publish_post",
          details: `Automatically published scheduled post to ${job.platform}: "${post.title || post.content.slice(0, 30)}..."`,
          platform: job.platform,
          status: "success",
        })

        // Notify user of success
        await Notification.create({
          userId: post.userId,
          title: "Post Published",
          message: `Your scheduled post was published successfully to ${job.platform}.`,
          type: "success",
        })
      } catch (err: any) {
        const errorMsg = err.message || "Unknown error during automatic publishing"
        job.retryCount += 1
        job.executionLogs.push({
          timestamp: new Date(),
          message: `Attempt ${job.retryCount} failed: ${errorMsg}`,
          status: "failed",
        })

        // Retry scheduling (Attempt 1: wait 5m -> Attempt 2: wait 15m -> Attempt 3: Mark Failed)
        if (job.retryCount === 1) {
          job.status = "retrying"
          job.runAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes delay
          job.executionLogs.push({
            timestamp: new Date(),
            message: `Scheduling retry 2 of 3 in 5 minutes.`,
            status: "retrying",
          })
          await job.save()

          post.status = "publishing"
          post.errorMessage = `Retry 1 failed on ${job.platform}: ${errorMsg}`
          await post.save()

          // Notify Retry Started
          await Notification.create({
            userId: post.userId,
            title: "Retry Started",
            message: `Retry attempt 2 scheduled for ${job.platform} in 5 minutes.`,
            type: "info",
          })
        } else if (job.retryCount === 2) {
          job.status = "retrying"
          job.runAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes delay
          job.executionLogs.push({
            timestamp: new Date(),
            message: `Scheduling retry 3 of 3 in 15 minutes.`,
            status: "retrying",
          })
          await job.save()

          post.status = "publishing"
          post.errorMessage = `Retry 2 failed on ${job.platform}: ${errorMsg}`
          await post.save()

          // Notify Retry Started
          await Notification.create({
            userId: post.userId,
            title: "Retry Started",
            message: `Retry attempt 3 scheduled for ${job.platform} in 15 minutes.`,
            type: "info",
          })
        } else {
          // Max retries reached
          job.status = "failed"
          await job.save()

          post.status = "failed"
          post.errorMessage = `All automatic publishing attempts failed for ${job.platform}: ${errorMsg}`
          await post.save()

          // Update connection error if applicable
          if (errorMsg.toLowerCase().includes("token") || errorMsg.toLowerCase().includes("connection")) {
            const account = await SocialAccount.findOne({
              userId: post.userId,
              platform: job.platform as any,
            })
            if (account) {
              account.status = "expired"
              await account.save()
            }
          }

          // Notify Failure
          await Notification.create({
            userId: post.userId,
            title: "Post Failed",
            message: `Your scheduled post failed to publish to ${job.platform} after 3 attempts: ${errorMsg}`,
            type: "error",
          })

          await ActivityLog.create({
            userId: post.userId,
            action: "publish_post",
            details: `Failed to automatically publish scheduled post to ${job.platform} after retries. Error: ${errorMsg}`,
            platform: job.platform,
            status: "failed",
          })
        }
      }
    }
  } catch (error) {
    console.error("Scheduler system check error:", error)
  } finally {
    isChecking = false
  }
}

export function initScheduler() {
  if (schedulerInterval) return

  console.log("Initializing GrowWave Automatic Publishing Scheduler Engine...")

  // Execute immediately on startup
  checkScheduleQueue()

  // Polling database queue every 15 seconds
  schedulerInterval = setInterval(() => {
    checkScheduleQueue()
  }, 15000)
}
