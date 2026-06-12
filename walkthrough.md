# Walkthrough — Dual Model AI Architecture & Port Management

We have successfully implemented and verified the professional multi-model AI architecture inside GrowWave supporting exactly **Gemini** and **Z.ai (GLM)**, alongside the strict development port lock on `http://localhost:3000`.

---

## 1. Port Lock & Environment Configuration

- **Development Port Lock**: Updated [package.json](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/package.json) dev and start scripts to enforce port 3000:
  ```json
  "scripts": {
    "dev": "next dev -p 3000",
    "start": "next start -p 3000"
  }
  ```
  This prevents fallback to 3001/3002 if port 3000 is occupied, showing an `EADDRINUSE` error instead.
- **Environment variables**: Configured `NEXT_PUBLIC_APP_URL="http://localhost:3000"` in `.env` and updated Facebook OAuth login routes ([route.ts](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/app/api/auth/facebook/route.ts) and [callback/route.ts](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/app/api/auth/facebook/callback/route.ts)) to use it.

---

## 2. Dual Provider AI Services

- **Z.ai Provider**: Added [zai.ts](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/lib/ai/providers/zai.ts) targeting the `glm-5-turbo` model and pointing to `https://api.z.ai/api/paas/v4` utilizing the standard OpenAI SDK client wrapper.
- **AI Manager**: Refactored [manager.ts](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/lib/ai/manager.ts) to register the `ZAIProvider` and `GeminiProvider` as the only two models, removing the legacy `openai.ts` provider.
- **Quota & Cost Tracking**: Updated [ai-quota.ts](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/lib/ai-quota.ts) to calculate GLM-5 usage costs correctly.

---

## 3. Backend & Database Storage

- **Stream Chat endpoint**: Refactored [/api/ai/chat](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/app/api/ai/chat/route.ts) to accept the selected model from request body, stream responses, and log latency and token usage in the console.
- **MongoDB Records**: Prompt details, responses, model names (`"gemini"` or `"zai"`), and timestamps are logged into `AIGeneration` (collection `aigenerations`) and user conversation history `AIConversation`.
- **Friendly Errors**:
  - Gemini: Displays `"Gemini quota limit reached. Please try again later or switch to Z.ai."` on 429 quota exhaustion.
  - Z.ai: Displays `"Z.ai is temporarily unavailable. Please try again later."` alongside details on 429 balance exhaustion.

---

## 4. Frontend Model Selector & Admin Dashboard

- **UI Select Dropdown**: Placed the `[ AI Model ▼ ]` selector in the top-right chat header of `/dashboard/ai-assistant`.
- **Badges**: Displays `🟢 Gemini` or `🔵 Z.ai` badges next to assistant messages in chat history and stream blocks.
- **Admin Stats**: Updated `/admin` page and `/api/admin` backend actions under the `ai-usage` tab to group statistics strictly by Gemini and Z.ai (mapping legacy OpenAI logs under Z.ai).

---

## 5. Verification Accomplishments

1. **Next.js Production Build**: Ran `npm run build` which succeeded with no TypeScript errors or path/routing conflicts.
2. **API Key Checks**: Programmatically executed validation scripts verifying that both Gemini and Z.ai return 429 codes (Gemini for free-tier daily quota limit, Z.ai for empty credits balance), validating that custom friendly error components catch them properly.
3. **Database logs**: Inspected MongoDB records to confirm successful logging of `ZAI` provider entries under `aiusages` collection and verified that metrics are correctly compiled.
