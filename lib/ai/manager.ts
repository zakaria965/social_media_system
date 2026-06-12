import { getGeminiProvider } from "./providers/gemini"
import { getOpenAIProvider } from "./providers/openai"
import { AIProvider, AIResult } from "./providers/interface"
import { PlatformSettings } from "@/lib/models/platform-settings"
import { recordAIUsage } from "@/lib/ai-quota"

export async function executeAIOperation(
  operation: (provider: AIProvider) => Promise<AIResult>,
  options: { userId: string; workspaceId: string | null; feature: string }
): Promise<AIResult> {
  const settings = await PlatformSettings.findOne()
  const selection = settings?.aiProvider || "gemini"

  // Emergency shutdown check (if settings exist and kill switch is active)
  if (settings?.openaiEmergencyShutdown) {
    throw new Error("AI services are temporarily disabled by the administrator.")
  }

  const startTime = Date.now()
  const providersToTry: { name: string; getProvider: () => AIProvider }[] = []

  // Enforce Gemini API as the sole provider
  providersToTry.push({ name: "GEMINI", getProvider: getGeminiProvider })

  let lastError: any = null

  for (const prov of providersToTry) {
    try {
      // API Key presence verification before calling
      if (prov.name === "GEMINI" && !process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables")
      }
      if (prov.name === "OPENAI" && !process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not defined in environment variables")
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
        model: prov.name === "GEMINI" ? "gemini-2.5-flash" : "gpt-4o-mini",
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
