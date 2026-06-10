import { GoogleGenerativeAI } from "@google/generative-ai"
import { AIProvider, AIResult } from "./interface"

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI | null = null

  private getClient() {
    if (!this.client) {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) throw new Error("GEMINI_API_KEY is not defined")
      this.client = new GoogleGenerativeAI(apiKey)
    }
    return this.client
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<AIResult> {
    const client = this.getClient()
    const modelName = "gemini-2.0-flash"
    
    // Set system instruction if provided
    const model = client.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt
    })

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1024 }
    })

    const result = response.response
    const text = result.text() || ""

    const promptTokens = result.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4)
    const completionTokens = result.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4)
    const totalTokens = promptTokens + completionTokens
    // Gemini 2.0 Flash pricing: $0.075 / 1M input tokens, $0.30 / 1M output tokens
    const cost = promptTokens * 0.000000075 + completionTokens * 0.00000030

    return {
      text,
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
      model: modelName
    }
  }

  async generateCaption(prompt: string, tone?: string): Promise<AIResult> {
    const toneInstruction = tone ? `Use a ${tone} tone.` : ""
    const systemPrompt = `You are a professional social media content creator. Write engaging social media captions. ${toneInstruction} Keep it concise and include relevant emojis where appropriate. Do not include hashtags in the response.`
    return this.generateText(prompt, systemPrompt)
  }

  async generateHashtags(prompt: string): Promise<AIResult> {
    const systemPrompt = `You are a social media hashtag strategist. Generate a list of 10-15 relevant hashtags based on the given content. Return them as a comma-separated list. Mix broad and niche tags.`
    return this.generateText(prompt, systemPrompt)
  }

  async generateCalendar(prompt: string): Promise<AIResult> {
    const systemPrompt = `You are a social media content strategist. Generate creative content ideas based on the given topic. Return a markdown table with columns: Date, Platform, Topic, Caption, Goal, Suggested Media.`
    return this.generateText(prompt, systemPrompt)
  }

  async analyzeAnalytics(context: any, prompt?: string): Promise<AIResult> {
    const systemPrompt = `You are GrowWave's Senior Social Media Analytics Analyst. Analyze the provided workspace analytics context and provide growth recommendations.`
    const userPrompt = `Context:\n${JSON.stringify(context, null, 2)}\n\nUser Question/Prompt: ${prompt || "Analyze this workspace performance."}`
    return this.generateText(userPrompt, systemPrompt)
  }

  async generateGrowthStrategy(context: any, prompt?: string): Promise<AIResult> {
    const systemPrompt = `You are GrowWave's Senior Social Media Growth Strategist. Perform a detailed growth strategy and SWOT analysis for the workspace.`
    const userPrompt = `Context:\n${JSON.stringify(context, null, 2)}\n\nUser Question/Prompt: ${prompt || "Generate a growth strategy."}`
    return this.generateText(userPrompt, systemPrompt)
  }
}

let geminiInstance: GeminiProvider | null = null
export function getGeminiProvider() {
  if (!geminiInstance) {
    geminiInstance = new GeminiProvider()
  }
  return geminiInstance
}
