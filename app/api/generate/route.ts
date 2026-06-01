import { NextRequest, NextResponse } from "next/server"

type Provider = "openai" | "gemini" | "anthropic" | "xai"

type Action =
  | "generate-caption"
  | "rewrite-text"
  | "change-tone"
  | "generate-hashtags"
  | "content-ideas"
  | "improve-grammar"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const XAI_API_KEY = process.env.XAI_API_KEY

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1024,
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ""
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
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
        generationConfig: { maxOutputTokens: 1024 },
      }),
    }
  )
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
}

async function callAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  })
  const data = await res.json()
  return data.content?.[0]?.text ?? ""
}

async function callXAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-2-1212",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1024,
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ""
}

const providerMap: Record<Provider, (sys: string, user: string) => Promise<string>> = {
  openai: callOpenAI,
  gemini: callGemini,
  anthropic: callAnthropic,
  xai: callXAI,
}

function getSystemPrompt(action: Action, tone?: string): string {
  const toneInstruction = tone ? `Use a ${tone} tone.` : ""
  switch (action) {
    case "generate-caption":
      return `You are a professional social media content creator. Write engaging social media captions. ${toneInstruction} Keep it concise and include relevant emojis where appropriate. Do not include hashtags in the response.`
    case "rewrite-text":
      return `You are a professional copywriter. Rewrite the given text to make it more engaging and effective for social media. ${toneInstruction} Improve clarity and impact while preserving the core message.`
    case "change-tone":
      return `You are a professional copywriter. Rewrite the given text in a ${tone || "different"} tone while preserving the core message.`
    case "generate-hashtags":
      return `You are a social media hashtag strategist. Generate a list of 10-15 relevant hashtags based on the given content. Return them as a comma-separated list. Mix broad and niche tags.`
    case "content-ideas":
      return `You are a social media content strategist. Generate 5 creative content ideas based on the given topic. Each idea should be 1-2 sentences. Number them 1-5.`
    case "improve-grammar":
      return `You are a professional editor. Fix grammar, spelling, and punctuation errors in the given text. Preserve the original meaning and style as much as possible.`
    default:
      return "You are a helpful social media assistant."
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, prompt, tone, provider = "openai" } = body as {
      action: Action
      prompt: string
      tone?: string
      provider?: Provider
    }

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const caller = providerMap[provider]
    if (!caller) {
      return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 })
    }

    const systemPrompt = getSystemPrompt(action, tone)
    const result = await caller(systemPrompt, prompt)

    return NextResponse.json({ result })
  } catch (err: unknown) {
    console.error("Generate API error:", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Generate API route is available.",
    providers: ["openai", "gemini", "anthropic", "xai"],
    actions: [
      "generate-caption",
      "rewrite-text",
      "change-tone",
      "generate-hashtags",
      "content-ideas",
      "improve-grammar",
    ],
  })
}
