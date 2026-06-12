import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"

interface BestTimeResponse {
  platform: string
  bestDay: string
  bestHour: string
  bestTimeWindow: string
  explanation: string
}

const fallbacks: Record<string, BestTimeResponse> = {
  facebook: {
    platform: "facebook",
    bestDay: "Tuesday",
    bestHour: "07:00 PM",
    bestTimeWindow: "06:00 PM - 08:00 PM",
    explanation: "Peak social shares and community activity observed on weeknights.",
  },
  instagram: {
    platform: "instagram",
    bestDay: "Monday",
    bestHour: "06:00 PM",
    bestTimeWindow: "05:00 PM - 07:00 PM",
    explanation: "Commute hours and evening social scrolling exhibit maximum visual retention.",
  },
  linkedin: {
    platform: "linkedin",
    bestDay: "Wednesday",
    bestHour: "09:00 AM",
    bestTimeWindow: "08:00 AM - 10:30 AM",
    explanation: "Business professionals digest corporate updates right at the start of mid-week workdays.",
  },
  twitter: {
    platform: "twitter",
    bestDay: "Thursday",
    bestHour: "04:00 PM",
    bestTimeWindow: "03:00 PM - 05:00 PM",
    explanation: "Late afternoon tech and industry discussions yield high engagement rates before close of business.",
  },
  tiktok: {
    platform: "tiktok",
    bestDay: "Friday",
    bestHour: "08:00 PM",
    bestTimeWindow: "07:00 PM - 09:30 PM",
    explanation: "Weekend entertainment and short-form video consumption surge dramatically starting Friday evening.",
  },
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get("platform")?.toLowerCase() || "facebook"

    const baseSuggestion = fallbacks[platform] || fallbacks.facebook

    // AI Generation integration if API Key exists
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    if (GEMINI_API_KEY) {
      try {
        const systemPrompt = `You are a Social Media Audience Analytics AI. Suggest the absolute best day, hour, and time window to schedule posts for high engagement on the platform: "${platform}". Respond with a valid JSON object ONLY containing fields: platform, bestDay, bestHour (in 12-hour AM/PM format, e.g. "07:00 PM"), bestTimeWindow (e.g. "06:00 PM - 08:00 PM"), and explanation. Do not wrap in markdown or backticks.`
        const userPrompt = `Generate the scheduling recommendation for: ${platform}`

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
                },
              ],
              generationConfig: { maxOutputTokens: 200, responseMimeType: "application/json" },
            }),
          }
        )

        if (res.ok) {
          const data = await res.json()
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            const parsed = JSON.parse(text)
            if (parsed.bestDay && parsed.bestHour && parsed.bestTimeWindow) {
              return NextResponse.json(parsed)
            }
          }
        }
      } catch (aiErr) {
        console.error("AI suggest time error:", aiErr)
      }
    }

    return NextResponse.json(baseSuggestion)
  } catch (err: unknown) {
    console.error("GET /api/generate/best-time error:", err)
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
