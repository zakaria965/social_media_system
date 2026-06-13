import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/user"
import { Subscription } from "@/lib/models/subscription"
import { ActivityLog } from "@/lib/models/activity"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email.toLowerCase()

    // Find user record in MongoDB
    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update plan fields
    user.plan = "PRO"
    user.subscriptionStatus = "ACTIVE"
    await user.save()

    // Log successful upgrade event for conversion analytics
    await ActivityLog.create({
      userId: email,
      workspaceId: null,
      action: "upgrade_success",
      details: "Successfully upgraded to GrowWave Pro",
      status: "success",
    })

    // Upsert subscription record details
    await Subscription.findOneAndUpdate(
      { userId: user._id },
      {
        plan: "PRO",
        status: "ACTIVE",
        billingCycle: "yearly",
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year expiry
        stripeCustomerId: "cus_mock_" + Math.random().toString(36).substr(2, 9),
        stripeSubscriptionId: "sub_mock_" + Math.random().toString(36).substr(2, 9),
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({
      success: true,
      plan: "PRO",
      subscriptionStatus: "ACTIVE",
      message: "Successfully upgraded to GrowWave Pro 🚀"
    })
  } catch (err: any) {
    console.error("Upgrade billing API error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
