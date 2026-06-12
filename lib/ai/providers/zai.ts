import OpenAI from "openai"
import { AIProvider, AIResult } from "./interface"

export class ZAIProvider implements AIProvider {
  private client: OpenAI | null = null

  private getClient() {
    if (!this.client) {
      const apiKey = process.env.ZAI_API_KEY
      if (!apiKey) throw new Error("ZAI_API_KEY is not defined")
      this.client = new OpenAI({
        apiKey,
        baseURL: "https://api.z.ai/api/paas/v4"
      })
    }
    return this.client
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<AIResult> {
    const client = this.getClient()
    const modelName = "glm-5-turbo"
    
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = []
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt })
    }
    messages.push({ role: "user", content: prompt })

    const response = await client.chat.completions.create({
      model: modelName,
      messages,
      max_tokens: 2048
    })

    const text = response.choices[0]?.message?.content || ""
    const promptTokens = response.usage?.prompt_tokens || Math.ceil(prompt.length / 4)
    const completionTokens = response.usage?.completion_tokens || Math.ceil(text.length / 4)
    const totalTokens = promptTokens + completionTokens
    // Z.ai GLM-5-Turbo cost estimate
    const cost = promptTokens * 0.0000001 + completionTokens * 0.0000003

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

let zaiInstance: ZAIProvider | null = null
export function getZAIProvider() {
  if (!zaiInstance) {
    zaiInstance = new ZAIProvider()
  }
  return zaiInstance
}
