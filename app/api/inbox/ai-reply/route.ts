import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/user"
import { executeAIOperation } from "@/lib/ai/manager"

// Helper for local keyword-based NLP fallback when OpenAI key is missing or calls fail
function getLocalFallbackReply(text: string, tone: string, length: string): string {
  const lowercaseText = text.toLowerCase()
  let topic = "general"

  if (lowercaseText.includes("pricing") || lowercaseText.includes("cost") || lowercaseText.includes("enterprise") || lowercaseText.includes("buy")) {
    topic = "pricing"
  } else if (lowercaseText.includes("help") || lowercaseText.includes("issue") || lowercaseText.includes("bug") || lowercaseText.includes("composer") || lowercaseText.includes("error")) {
    topic = "support"
  } else if (lowercaseText.includes("terrible") || lowercaseText.includes("broken") || lowercaseText.includes("bad")) {
    topic = "complaint"
  } else if (lowercaseText.includes("collab") || lowercaseText.includes("partner") || lowercaseText.includes("webinar")) {
    topic = "partnership"
  } else if (lowercaseText.includes("love") || lowercaseText.includes("cool") || lowercaseText.includes("stunning") || lowercaseText.includes("great")) {
    topic = "compliment"
  }

  // Tone-specific templates
  const responses: Record<string, Record<string, { short: string; detailed: string }>> = {
    pricing: {
      professional: {
        short: "We offer tailored subscription options suitable for different team sizes.",
        detailed: "Thank you for inquiring. We offer standard plans as well as customizable enterprise solutions with bulk scheduling and custom permissions. Let us know if you would like to arrange a 15-minute demo call."
      },
      friendly: {
        short: "We've got super flexible options depending on your team size!",
        detailed: "Thanks for asking! Our plans range from starter packs up to fully customized enterprise accounts for larger creative agencies. We would love to chat and find the perfect fit for you!"
      },
      sales: {
        short: "Our customized enterprise plans unlock up to 35% discount for teams.",
        detailed: "Excellent timing! We are currently running a team bundle promotion that includes a free 14-day premium trial and onboarding assistance. Let us know if we can schedule a demo for you today!"
      },
      support: {
        short: "You can find all pricing packages under growwave.com/pricing.",
        detailed: "Please visit our pricing overview page or contact our account representatives directly. We will ensure we construct the absolute best package for your workflow constraints."
      }
    },
    support: {
      professional: {
        short: "We have registered this issue and our technical staff is reviewing it.",
        detailed: "Thank you for reporting this issue. Our engineering team is currently investigating the loading speed of the composer window. We will notify you immediately once a hotfix is deployed."
      },
      friendly: {
        short: "Oh no! Thanks for letting us know, we are on it!",
        detailed: "Thanks for the heads-up! We're checking this composer load issue right away with our dev team. Could you try clearing your cache or restarting the browser in the meantime? Keep us posted!"
      },
      sales: {
        short: "Our premium customer support includes 24/7 priority ticket resolution.",
        detailed: "We are immediately raising a priority ticket for this account issue. Upgrading to our premium subscription will grant you direct access to live chat support and instant hotfixes."
      },
      support: {
        short: "Please submit your browser logs and file format details to support.",
        detailed: "We apologize for the inconvenience. To resolve this composer speed issue, please confirm if the image size exceeds 5MB or if you are using a specific browser version. We are here to help."
      }
    },
    complaint: {
      professional: {
        short: "We apologize for the inconvenience and are working to resolve this.",
        detailed: "Please accept our sincere apologies for this service delay. We are actively auditing our scheduling queue to ensure all posts publish at their precise timestamps. Thank you for your patience."
      },
      friendly: {
        short: "We are so sorry for this hiccup! Let us make it right.",
        detailed: "Oh no, we are truly sorry about that! We always strive for a perfect publishing experience, and we are working hard to audit this scheduler delay immediately. Thank you for flagging this!"
      },
      sales: {
        short: "Our enterprise SLAs guarantee 99.9% scheduled posting accuracy.",
        detailed: "We are auditing your queue performance now. Upgrading to our dedicated publishing server guarantees maximum posting speed and completely avoids any shared network latency."
      },
      support: {
        short: "We have opened an active engineering audit on your scheduling queue.",
        detailed: "We appreciate your feedback and apologize for the error. Our support staff has flagged your scheduling logs to find the exact source of this timestamp latency. We will follow up shortly."
      }
    },
    partnership: {
      professional: {
        short: "We are interested in exploring collaboration opportunities.",
        detailed: "Thank you for reaching out. We are always interested in collaborating on webinars and content creations. Please send your pitch or calendar details to partner@growwave.com."
      },
      friendly: {
        short: "That sounds like an amazing idea! We would love to collaborate.",
        detailed: "Wow, that sounds so much fun! We love partnering with fellow creators on webinars and guides. Let us know who to contact on your team and let's make it happen!"
      },
      sales: {
        short: "Let's set up a collaborative event to expand both our audiences.",
        detailed: "This sounds highly strategic! A joint marketing webinar will introduce GrowWave to your startup network while highlighting your design systems. Let's arrange a brief planning session."
      },
      support: {
        short: "We have routed your partnership proposal to our marketing division.",
        detailed: "Thank you for the suggestion. I have forwarded this collaboration inquiry to our partnership coordinators, who will review your channel audience specs and reply shortly."
      }
    },
    compliment: {
      professional: {
        short: "We appreciate your kind words and support.",
        detailed: "Thank you so much for the feedback! We are deeply committed to delivering the absolute best user interface and engagement tools for social media managers."
      },
      friendly: {
        short: "Thank you so much! That really made our day! 🎉",
        detailed: "Aww, thank you! That is so kind of you to say. We are super happy you're loving the dark mode and clean charts. There is a lot of awesome stuff coming up next!"
      },
      sales: {
        short: "Unlock even more stunning charts with our premium dashboard tools.",
        detailed: "We're thrilled you're loving the experience! Upgrading to our premium subscription will unlock even more powerful analytics boards, unlimited posts, and advanced AI composition tools."
      },
      support: {
        short: "Thank you for the support. Let us know if you need assistance.",
        detailed: "We are extremely glad you are enjoying the dashboard experience. Feel free to reach out to our team at any time if you have questions or feature suggestions!"
      }
    },
    general: {
      professional: {
        short: "Thank you for reaching out. We will review your message shortly.",
        detailed: "Thank you for connecting with us. We appreciate your interest in GrowWave and our social media management solutions. We will verify your query and follow up."
      },
      friendly: {
        short: "Thanks for reaching out! We'll get back to you soon! 😊",
        detailed: "Hey there! Thanks so much for sending us a message. We're super excited to connect with you, and one of our team members will jump in to chat very soon!"
      },
      sales: {
        short: "Discover how GrowWave can help double your organic reach today.",
        detailed: "Thanks for reaching out! GrowWave's AI scheduling and analytics integrations are designed to help scale audience engagement rapidly. Let us know how we can help you scale."
      },
      support: {
        short: "Thank you for your message. How can we help you today?",
        detailed: "Thank you for contacting our engagement desk. Please let us know if you have any questions about scheduler setups, account synchronizations, or composer uploads."
      }
    }
  }

  const selectedTopic = responses[topic] || responses.general
  const selectedTone = selectedTopic[tone] || selectedTopic.professional

  return length === "short" ? selectedTone.short : selectedTone.detailed
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const email = session.user.email
    const dbUser = await User.findOne({ email }).select("_id")
    const userId = dbUser?._id.toString() || "unknown"

    const body = await request.json()
    const { text, tone = "professional", length = "short", originalReply } = body as {
      text: string
      tone?: "professional" | "friendly" | "sales" | "support"
      length?: "short" | "detailed"
      originalReply?: string
    }

    if (!text) {
      return NextResponse.json({ error: "Interaction text is required" }, { status: 400 })
    }

    const activeText = originalReply ? `Rewrite this reply: "${originalReply}" to fit this customer query: "${text}"` : text

    try {
      const systemPrompt = `You are GrowWave's social media reply assistant. Generate a high-converting, professional, and friendly response.
Tone parameters:
- Tone: ${tone} (make it sound naturally ${tone})
- Length: ${length} (short = 1 brief sentence, detailed = 2-3 detailed sentences)
Additional constraints:
- Do not include hashtags or generic placeholders in the output.
- Speak directly as a friendly support agent from the GrowWave team.
- Return ONLY the drafted message response.`

      const aiResult = await executeAIOperation(
        async (provider) => provider.generateText(activeText, systemPrompt),
        { userId, workspaceId: null, feature: "Caption Generator" }
      )
      if (aiResult.text) {
        return NextResponse.json({ result: aiResult.text })
      }
    } catch (err) {
      console.error("AI call in ai-reply failed, using fallback:", err)
    }

    // Return fallback NLP suggestion if OpenAI key is missing or request fails
    const result = getLocalFallbackReply(activeText, tone, length)
    return NextResponse.json({ result })
  } catch (err: unknown) {
    console.error("POST /api/inbox/ai-reply error:", err)
    const msg = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
