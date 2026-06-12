import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/user"
import { AIGeneration } from "@/lib/models/ai-generation"
import { generateGeminiContent } from "@/lib/ai/gemini"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email.toLowerCase().trim()
    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Initialize credits if not set
    if (user.aiCreditsRemaining === undefined || user.aiCreditsRemaining === null) {
      user.aiCreditsRemaining = 5
      user.aiCreditsUsed = 0
      await user.save()
    }

    const isFreePlan = user.plan !== "PRO"

    // Quota verification
    if (isFreePlan && user.aiCreditsRemaining <= 0) {
      return NextResponse.json(
        { error: "AI Limit Reached", errorCode: "QUOTA_EXCEEDED" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { prompt, history } = body as {
      prompt: string
      history?: any[]
    }

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const plan = user.plan?.toLowerCase() || "free"
    const quota = (plan === "pro" || user.role === "ADMIN") ? "unlimited" : `${Math.max(0, user.aiCreditsRemaining || 0)}`

    // Log request initiation
    console.log(`[AI]\nUser: ${user._id.toString()}\nPlan: ${plan}\nQuota: ${quota}\nGemini: initiated`)

    try {
      // Call Gemini API
      const responseText = await generateGeminiContent(prompt, history || [])

      // Log response success
      console.log(`[AI]\nUser: ${user._id.toString()}\nPlan: ${plan}\nQuota: ${quota}\nGemini: success`)

      // Log the request to database
      await AIGeneration.create({
        userId: user._id.toString(),
        prompt: prompt,
        response: responseText,
        model: "gemini",
        createdAt: new Date(),
      })

      // Update credits for FREE users
      if (isFreePlan) {
        user.aiCreditsRemaining = Math.max(0, user.aiCreditsRemaining - 1)
        user.aiCreditsUsed = (user.aiCreditsUsed || 0) + 1
        await user.save()
      }

      return NextResponse.json({ response: responseText })
    } catch (err: any) {
      // Log response failed
      console.log(`[AI]\nUser: ${user._id.toString()}\nPlan: ${plan}\nQuota: ${quota}\nGemini: failed`)
      throw err
    }
  } catch (err: any) {
    console.error("AI Generate API error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to generate AI response" },
      { status: 500 }
    )
  }
}
