import { getGeminiProvider } from "./providers/gemini"
import { getZAIProvider } from "./providers/zai"
import { AIProvider, AIResult } from "./providers/interface"
import { PlatformSettings } from "@/lib/models/platform-settings"
import { recordAIUsage } from "@/lib/ai-quota"

export async function executeAIOperation(
  operation: (provider: AIProvider) => Promise<AIResult>,
  options: {
    userId: string
    workspaceId: string | null
    feature: string
    prompt?: string
    providerOverride?: "gemini" | "zai"
  }
): Promise<AIResult> {
  const settings = await PlatformSettings.findOne()
  const selection = options.providerOverride
    ? (options.providerOverride === "zai" ? "openai" : "gemini")
    : (settings?.aiProvider || "gemini")

  // Emergency shutdown check (if settings exist and kill switch is active)
  if (settings?.openaiEmergencyShutdown) {
    throw new Error("AI services are temporarily disabled by the administrator.")
  }

  const startTime = Date.now()
  const providersToTry: { name: string; getProvider: () => AIProvider }[] = []

  // Register Gemini and Z.ai (GLM) providers
  if (selection === "openai") {
    providersToTry.push({ name: "ZAI", getProvider: getZAIProvider })
    providersToTry.push({ name: "GEMINI", getProvider: getGeminiProvider })
  } else {
    providersToTry.push({ name: "GEMINI", getProvider: getGeminiProvider })
    providersToTry.push({ name: "ZAI", getProvider: getZAIProvider })
  }

  let lastError: any = null

  for (const prov of providersToTry) {
    try {
      // API Key presence verification before calling
      if (prov.name === "GEMINI" && !process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables")
      }
      if (prov.name === "ZAI" && !process.env.ZAI_API_KEY) {
        throw new Error("ZAI_API_KEY is not defined in environment variables")
      }

      const providerInstance = prov.getProvider()
      const result = await operation(providerInstance)

      const responseTime = Date.now() - startTime

      // Record successful usage
      await recordAIUsage({
        userId: options.userId,
        workspaceId: options.workspaceId,
        feature: options.feature,
        provider: prov.name,
        model: result.model,
        prompt: options.prompt,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        responseTime,
        status: "success"
      })

      return result
    } catch (err: any) {
      console.error(`Technical error details internally for provider ${prov.name}:`, err)
      lastError = err

      const responseTime = Date.now() - startTime
      // Record failed usage
      await recordAIUsage({
        userId: options.userId,
        workspaceId: options.workspaceId,
        feature: options.feature,
        provider: prov.name,
        model: prov.name === "GEMINI" ? "gemini-2.5-flash" : "glm-5-turbo",
        prompt: options.prompt,
        promptTokens: 0,
        completionTokens: 0,
        responseTime,
        status: "failed"
      })
    }
  }

  // All providers failed: return friendly message
  throw new Error("AI Assistant is temporarily unavailable. Please try again.")
}
