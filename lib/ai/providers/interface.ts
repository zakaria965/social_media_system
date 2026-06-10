export interface AIResult {
  text: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cost: number
  model: string
}

export interface AIProvider {
  generateText(prompt: string, systemPrompt?: string): Promise<AIResult>
  generateCaption(prompt: string, tone?: string): Promise<AIResult>
  generateHashtags(prompt: string): Promise<AIResult>
  generateCalendar(prompt: string): Promise<AIResult>
  analyzeAnalytics(context: any, prompt?: string): Promise<AIResult>
  generateGrowthStrategy(context: any, prompt?: string): Promise<AIResult>
}
