import { GoogleGenerativeAI } from "@google/generative-ai"

let geminiClient: GoogleGenerativeAI | null = null

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined.")
    }
    geminiClient = new GoogleGenerativeAI(apiKey)
  }
  return geminiClient
}

export interface ChatMessageParam {
  role: "user" | "model"
  parts: { text: string }[]
}

/**
 * Generates content using Gemini API. Supports multi-turn chat if history is provided.
 */
export async function generateGeminiContent(
  prompt: string,
  history: ChatMessageParam[] = []
): Promise<string> {
  try {
    const client = getGeminiClient()
    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: "You are GrowWave's helpful, professional social media assistant AI. Write engaging captions, copy, hashtags, or answer marketing strategy questions. Keep responses optimized for digital channels."
    })

    if (history.length > 0) {
      const chat = model.startChat({
        history: history,
      })
      const result = await chat.sendMessage(prompt)
      const response = result.response
      return response.text() || ""
    } else {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1024 }
      })
      const response = result.response
      return response.text() || ""
    }
  } catch (error: any) {
    console.error("Gemini service error:", error)
    throw new Error(error.message || "Failed to communicate with Gemini API.")
  }
}
