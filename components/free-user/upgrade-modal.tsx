"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Zap, Sparkles, Shield, BarChart3, Users, MessageSquare, Loader2, CreditCard, ChevronLeft } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/toast-provider"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: "ai_quota" | "channels_limit" | "bulk_scheduling" | "analytics_pro" | "team_feature" | "inbox_feature" | "platform_locked" | "scheduler_limit" | "publish_limit" | ""
}

type UpgradeStep = "benefits" | "checkout" | "success"

export function UpgradeModal({ isOpen, onClose, reason = "" }: UpgradeModalProps) {
  const { update } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  
  const [step, setStep] = useState<UpgradeStep>("benefits")
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly")
  const [isUpgrading, setIsUpgrading] = useState(false)

  // Checkout Form State
  const [cardName, setCardName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvc, setCardCvc] = useState("")
  const [cardZip, setCardZip] = useState("")

  // Reset step when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep("benefits")
      setIsUpgrading(false)
      // Reset inputs
      setCardName("")
      setCardNumber("")
      setCardExpiry("")
      setCardCvc("")
      setCardZip("")
    }
  }, [isOpen])

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isUpgrading) return

    // Simple validation
    if (!cardName || !cardNumber || !cardExpiry || !cardCvc || !cardZip) {
      showToast("Please fill in all credit card details.", "error")
      return
    }

    setIsUpgrading(true)
    
    // Simulate payment gateway delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    try {
      const response = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to upgrade plan")
      }
      
      // Upgrade successful! Go to success screen
      setStep("success")
      showToast("Payment Processed Successfully!", "success")
    } catch (err: any) {
      console.error("Error during upgrade:", err)
      showToast(err.message || "An unexpected error occurred during upgrade.", "error")
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleFinishUpgrade = async () => {
    setIsUpgrading(true)
    try {
      // Force refresh the NextAuth session so it fetches the new plan from MongoDB
      await update()
      // Navigate to the Pro Dashboard
      router.push("/dashboard")
      onClose()
    } catch (err) {
      console.error("Error updating session:", err)
      // Fallback redirect
      window.location.assign("/dashboard")
    } finally {
      setIsUpgrading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  const getReasonDetails = () => {
    switch (reason) {
      case "ai_quota":
        return {
          title: "Upgrade to GrowWave Pro",
          description: `You have used all 5 free AI requests available today.

Upgrade to GrowWave Pro for:
• Unlimited AI generations
• Advanced AI Assistant
• Unlimited scheduling
• Analytics
• Team collaboration
• Priority support`,
          icon: Sparkles,
        }
      case "channels_limit":
        return {
          title: "Connect More Channels",
          description: "Free plan accounts are limited to 1 social media profile. Upgrade to connect unlimited profiles.",
          icon: Zap,
        }
      case "platform_locked":
        return {
          title: "Unlock Twitter & TikTok",
          description: "Advanced channels like TikTok and Twitter/X require a Pro plan connection due to premium API access.",
          icon: Zap,
        }
      case "bulk_scheduling":
        return {
          title: "Unlock Bulk Scheduling",
          description: "Plan weeks of content in seconds. CSV uploading and queue auto-scheduling are available in Pro.",
          icon: Zap,
        }
      case "analytics_pro":
        return {
          title: "Unlock Advanced Analytics",
          description: "Get detailed reach breakdown, demographics, post performance heatmaps, and downloadable PDF reports.",
          icon: BarChart3,
        }
      case "team_feature":
        return {
          title: "Invite Your Team",
          description: "Collaborate, assign approval roles, and review drafts with team workspaces in GrowWave Pro.",
          icon: Users,
        }
      case "inbox_feature":
        return {
          title: "Unified Social Inbox",
          description: "Reply to comments, DMs, and mentions from Facebook, Instagram, and LinkedIn in one single stream.",
          icon: MessageSquare,
        }
      case "scheduler_limit":
        return {
          title: "Upgrade to GrowWave Pro",
          description: "You've reached your free scheduling limit.\n\nFree users can schedule up to 5 posts per day.\n\nUpgrade to GrowWave Pro for unlimited scheduling, AI tools, analytics, and team collaboration.",
          icon: Zap,
        }
      case "publish_limit":
        return {
          title: "Upgrade to GrowWave Pro",
          description: "You have reached your daily publishing limit.\n\nFree Plan includes:\n• 3 published posts per day\n\nUpgrade to GrowWave Pro for:\n• Unlimited publishing\n• Unlimited scheduling\n• Unlimited AI generations\n• Advanced analytics\n• Team collaboration\n• Priority support",
          icon: Zap,
        }
      default:
        return {
          title: "Upgrade to GrowWave Pro",
          description: "Unlock the full potential of your social media growth with premium features and unlimited scheduling.",
          icon: Zap,
        }
    }
  }

  const details = getReasonDetails()
  const DetailIcon = details.icon

  const proFeatures = [
    { title: "Unlimited Social Channels", desc: "Connect Facebook, Instagram, LinkedIn, TikTok, Twitter/X" },
    { title: "Advanced AI Copilot", desc: "Unlimited credits, conversational brainstorming, performance insights" },
    { title: "Unlimited Scheduled Posts", desc: "No caps on drafts or scheduled queues" },
    { title: "Advanced Analytics Reports", desc: "Audience demographics, heatmaps, PDF reports" },
    { title: "Team Collaboration", desc: "Add team members, custom roles, draft approvals" },
    { title: "Unified Social Inbox", desc: "Manage comments, DMs, and reviews in one inbox" },
  ]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={step === "checkout" && isUpgrading ? undefined : onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-[20px] border border-slate-200 bg-background shadow-2xl dark:border-slate-800 dark:bg-slate-900 z-10"
        >
          {/* Header Graphic */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[var(--brand-primary)]" />

          {!(step === "checkout" && isUpgrading) && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <X className="size-5" />
            </button>
          )}

          <div className="p-6 md:p-8">
            {step === "benefits" && (
              <>
                {/* Contextual Warning Header */}
                <div className="flex items-start gap-4 border-b border-slate-100 pb-6 dark:border-slate-800">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10 text-emerald-600 dark:text-emerald-400">
                    <DetailIcon className="size-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      GrowWave Lite Limit Trigger
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {details.title}
                    </h3>
                    <p className="whitespace-pre-line text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                      {details.description}
                    </p>
                  </div>
                </div>

                {/* Pricing Comparison */}
                <div className="grid gap-6 md:grid-cols-12 mt-6">
                  {/* Pro Plan Cards List */}
                  <div className="md:col-span-7 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      What you get in GrowWave Pro:
                    </h4>
                    <ul className="grid gap-3">
                      {proFeatures.map((f, i) => (
                        <li key={i} className="flex gap-2.5 items-start">
                          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)]/20 text-emerald-600 dark:text-emerald-400 mt-0.5">
                            <Check className="size-3.5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                              {f.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                              {f.desc}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Checkout CTA Card */}
                  <div className="md:col-span-5 flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
                    <div>
                      {/* Period Switcher */}
                      <div className="flex items-center justify-between bg-slate-100 p-0.5 rounded-lg dark:bg-slate-800 mb-4">
                        <button
                          onClick={() => setBillingPeriod("monthly")}
                          className={`flex-1 text-[10px] font-bold uppercase py-1.5 rounded-md transition-all ${
                            billingPeriod === "monthly"
                              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          onClick={() => setBillingPeriod("yearly")}
                          className={`flex-1 text-[10px] font-bold uppercase py-1.5 rounded-md transition-all relative ${
                            billingPeriod === "yearly"
                              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Yearly
                          <span className="absolute -top-2.5 -right-1.5 bg-emerald-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-90">
                            -20%
                          </span>
                        </button>
                      </div>

                      <div className="text-center md:text-left">
                        <span className="text-xs font-semibold text-slate-400 block uppercase">
                          GrowWave Pro
                        </span>
                        <div className="flex items-baseline justify-center md:justify-start gap-1 mt-1">
                          <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                            {billingPeriod === "yearly" ? "$19" : "$24"}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            /month
                          </span>
                        </div>
                        {billingPeriod === "yearly" && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                            Billed annually ($228/year)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 space-y-2.5">
                      <button
                        onClick={() => {
                          fetch("/api/analytics/track", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "upgrade_click",
                              details: `User clicked Upgrade Now in the upgrade modal (Reason: ${reason || "general"}).`
                            })
                          }).catch(err => console.error("Failed to track upgrade click:", err))
                          setStep("checkout")
                        }}
                        className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-xs py-3 rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 active:scale-95 transition-all uppercase tracking-wider"
                      >
                        <Zap className="size-4 fill-current" />
                        {reason === "ai_quota" || reason === "publish_limit" ? "Upgrade to Pro" : "Upgrade Now"}
                      </button>
                      {reason === "scheduler_limit" || reason === "ai_quota" || reason === "publish_limit" ? (
                        <button
                          type="button"
                          onClick={onClose}
                          className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 font-extrabold text-xs py-3 rounded-lg flex items-center justify-center transition-all uppercase tracking-wider border border-slate-200 dark:border-slate-700"
                        >
                          Maybe Later
                        </button>
                      ) : (
                        <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
                          <Shield className="size-3" />
                          30-Day Money Back Guarantee
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === "checkout" && (
              <form onSubmit={handleProcessPayment} className="space-y-6">
                {/* Checkout Header */}
                <div className="flex items-center gap-3 border-b pb-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStep("benefits")}
                    disabled={isUpgrading}
                    className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      Checkout to GrowWave Pro
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      You are subscribing to the <span className="font-bold text-emerald-600">{billingPeriod}</span> plan.
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-xs font-semibold text-slate-400 uppercase block leading-none">Total Due</span>
                    <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {billingPeriod === "yearly" ? "$19" : "$24"}<span className="text-xs font-semibold text-slate-400">/mo</span>
                    </span>
                  </div>
                </div>

                {/* Mock Card Form */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-350 block mb-1.5 uppercase tracking-wider">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      required
                      disabled={isUpgrading}
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full h-10 rounded-lg border border-slate-200 bg-background px-3 text-xs font-bold outline-hidden focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 disabled:opacity-50 dark:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-350 block mb-1.5 uppercase tracking-wider">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="4111 2222 3333 4444"
                        maxLength={19}
                        required
                        disabled={isUpgrading}
                        value={cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim()
                          setCardNumber(val)
                        }}
                        className="w-full h-10 rounded-lg border border-slate-200 bg-background pl-10 pr-3 text-xs font-bold outline-hidden focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 disabled:opacity-50 dark:border-slate-800"
                      />
                      <CreditCard className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-350 block mb-1.5 uppercase tracking-wider">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                        disabled={isUpgrading}
                        value={cardExpiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, "")
                          if (val.length > 2) {
                            val = val.substring(0, 2) + "/" + val.substring(2, 4)
                          }
                          setCardExpiry(val)
                        }}
                        className="w-full h-10 rounded-lg border border-slate-200 bg-background px-3 text-xs font-bold text-center outline-hidden focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 disabled:opacity-50 dark:border-slate-800"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-350 block mb-1.5 uppercase tracking-wider">
                        CVC
                      </label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        required
                        disabled={isUpgrading}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))}
                        className="w-full h-10 rounded-lg border border-slate-200 bg-background px-3 text-xs font-bold text-center outline-hidden focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 disabled:opacity-50 dark:border-slate-800"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-350 block mb-1.5 uppercase tracking-wider">
                        Zip Code
                      </label>
                      <input
                        type="text"
                        placeholder="90210"
                        maxLength={10}
                        required
                        disabled={isUpgrading}
                        value={cardZip}
                        onChange={(e) => setCardZip(e.target.value)}
                        className="w-full h-10 rounded-lg border border-slate-200 bg-background px-3 text-xs font-bold text-center outline-hidden focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 disabled:opacity-50 dark:border-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Checkout CTA */}
                <div className="border-t pt-4 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Shield className="size-3.5 text-emerald-500" />
                    Secure 256-bit SSL checkout
                  </div>
                  <button
                    type="submit"
                    disabled={isUpgrading}
                    className="bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-xs px-6 py-2.5 rounded-lg flex items-center gap-2 uppercase tracking-wider shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="size-4 fill-current" />
                        Pay & Upgrade
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {step === "success" && (
              <div className="flex flex-col items-center justify-center text-center py-6 space-y-6">
                {/* Success Indicator Animation */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 size-20 rounded-full bg-[var(--brand-primary)]/10 animate-ping" />
                  <div className="size-20 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center shadow-lg">
                    <Check className="size-10 stroke-[3]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-[var(--brand-primary)] tracking-widest">
                    Checkout Completed
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    Payment Successful!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-455 max-w-md mx-auto leading-relaxed">
                    Thank you! Your account has been upgraded to <span className="font-extrabold text-slate-700 dark:text-white">GrowWave Pro</span>. You now have unlimited channel limits, full Copilot features, and premium reports.
                  </p>
                </div>

                <div className="w-full max-w-sm pt-4 border-t dark:border-slate-800">
                  <button
                    onClick={handleFinishUpgrade}
                    disabled={isUpgrading}
                    className="w-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Activating Plan...
                      </>
                    ) : (
                      <>
                        Go to Pro Dashboard
                        <Zap className="size-3.5 fill-current text-amber-400" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
