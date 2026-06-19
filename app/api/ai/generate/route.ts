import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/user"
import { AIGeneration } from "@/lib/models/ai-generation"
import { checkAIQuota, recordAIUsage, getTodayAIUsage, AI_LIMIT_REACHED } from "@/lib/ai-quota"
import { generateGeminiContent } from "@/lib/ai/gemini"
import OpenAI from "openai"
import { getActiveWorkspaceId } from "@/lib/workspaces"
import { Workspace } from "@/lib/models/workspace"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email.toLowerCase().trim()
    const workspaceId = await getActiveWorkspaceId(email, request)
    const ws = await Workspace.findById(workspaceId)
    const ownerEmail = ws?.ownerEmail || email
    const user = await User.findOne({ email: ownerEmail })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = user._id.toString()

    // Use the unified checkAIQuota — Pro users get unlimited, Free users get 5
    const quotaCheck = await checkAIQuota(userId)
    if (!quotaCheck.allowed) {
      console.log(`[AI REQUEST] BLOCKED\nUser: ${userId}\nPlan: ${user.plan || "FREE"}\nReason: ${quotaCheck.error}`)

      return NextResponse.json(
        {
          error: quotaCheck.error || "Your AI usage limit has been reached.",
          errorCode: quotaCheck.limitReached ? "QUOTA_EXCEEDED" : "UNAUTHORIZED",
          userPlan: quotaCheck.userPlan
        },
        { status: quotaCheck.limitReached ? 429 : 403 }
      )
    }

    const body = await request.json()
    const { prompt, history, model = "gemini" } = body as {
      prompt: string
      history?: any[]
      model?: "gemini" | "zai"
    }

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const plan = user.plan?.toLowerCase() || "free"
    const providerName = model === "zai" ? "Z.ai" : "Gemini"

    console.log(`[AI REQUEST]\nUser: ${userId}\nPlan: ${plan}\nProvider: ${providerName}\nUsage: ${user.requestsUsed || 0}`)

    try {
      if (plan === "free") {
        const todayUsage = await getTodayAIUsage(userId)
        if (todayUsage >= 5) {
          throw new AI_LIMIT_REACHED()
        }
      }

      let responseText = ""

      if (model === "zai") {
        // Z.ai provider
        const zaiApiKey = process.env.ZAI_API_KEY
        if (!zaiApiKey) {
          throw new Error("ZAI_API_KEY is not configured")
        }

        const zaiClient = new OpenAI({
          apiKey: zaiApiKey,
          baseURL: "https://api.z.ai/api/paas/v4"
        })

        const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
          { role: "system", content: "You are GrowWave's helpful, professional social media assistant AI. Write engaging captions, copy, hashtags, or answer marketing strategy questions. Keep responses optimized for digital channels." },
          { role: "user", content: prompt }
        ]

        const response = await zaiClient.chat.completions.create({
          model: "glm-5-turbo",
          messages,
          max_tokens: 2048
        })

        responseText = response.choices[0]?.message?.content || ""
      } else {
        // Gemini provider (default)
        responseText = await generateGeminiContent(prompt, history || [])
      }

      const responseTime = Date.now() - startTime
      const promptTokens = Math.ceil(prompt.length / 4)
      const completionTokens = Math.ceil(responseText.length / 4)

      console.log(`[AI RESPONSE]\nProvider: ${providerName}\nDuration: ${(responseTime / 1000).toFixed(1)}s\nTokens: ${promptTokens + completionTokens}`)

      // Record usage via the unified system
      await recordAIUsage({
        userId,
        workspaceId: null,
        feature: "AI Generate",
        provider: model === "zai" ? "ZAI" : "GEMINI",
        model: model === "zai" ? "glm-5-turbo" : "gemini-2.5-flash",
        prompt,
        promptTokens,
        completionTokens,
        responseTime,
        status: "success"
      })

      // Store in AI generations
      await AIGeneration.create({
        userId,
        prompt,
        response: responseText,
        model: model === "zai" ? "zai" : "gemini",
        createdAt: new Date(),
      })

      return NextResponse.json({ response: responseText })
    } catch (err: any) {
      if (err instanceof AI_LIMIT_REACHED) {
        return NextResponse.json(
          { error: err.message, errorCode: "QUOTA_EXCEEDED", userPlan: "FREE" },
          { status: 429 }
        )
      }

      const responseTime = Date.now() - startTime
      const errMsg = err?.message?.toLowerCase() || ""

      let errorCode = "SERVICE_UNAVAILABLE"
      let errorMessage = ""
      let httpStatus = 500

      if (model === "gemini" || model !== "zai") {
        if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("resource_exhausted")) {
          errorCode = "QUOTA_EXCEEDED"
          errorMessage = "Gemini quota limit reached. Please try again later or switch to Z.ai."
          httpStatus = 429
        } else {
          errorMessage = `Gemini error: ${err.message || "Unknown error"}`
        }
      } else {
        if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("balance") || errMsg.includes("recharge")) {
          errorCode = "QUOTA_EXCEEDED"
          errorMessage = "Z.ai is temporarily unavailable. Please try again later."
          httpStatus = 429
        } else {
          errorMessage = `Z.ai is temporarily unavailable. Please try again later.`
        }
      }

      console.error(`[AI ERROR]\nProvider: ${providerName}\nReason: ${err.message || err}`)

      await recordAIUsage({
        userId,
        workspaceId: null,
        feature: "AI Generate",
        provider: model === "zai" ? "ZAI" : "GEMINI",
        model: model === "zai" ? "glm-5-turbo" : "gemini-2.5-flash",
        prompt,
        promptTokens: 0,
        completionTokens: 0,
        responseTime,
        status: "failed"
      })

      return NextResponse.json(
        { error: errorMessage, errorCode },
        { status: httpStatus }
      )
    }
  } catch (err: any) {
    console.error("AI Generate API error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to generate AI response" },
      { status: 500 }
    )
  }
}
