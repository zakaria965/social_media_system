"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Zap, Sparkles, Shield, BarChart3, Users, MessageSquare, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: "ai_quota" | "channels_limit" | "bulk_scheduling" | "analytics_pro" | "team_feature" | "inbox_feature" | "platform_locked" | ""
}

export function UpgradeModal({ isOpen, onClose, reason = "" }: UpgradeModalProps) {
  const { update } = useSession()
  const router = useRouter()
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly")
  const [isUpgrading, setIsUpgrading] = useState(false)

  const handleUpgrade = async () => {
    if (isUpgrading) return
    setIsUpgrading(true)
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
      
      // Force refresh the NextAuth session so it fetches the new plan from MongoDB
      await update()
      
      // Navigate to the Pro Dashboard
      router.push("/dashboard")
      onClose()
    } catch (err: any) {
      console.error("Error during upgrade:", err)
      alert(err.message || "An unexpected error occurred during upgrade. Please try again.")
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
          title: "AI Quota Exceeded",
          description: "You've used all 50 AI requests for this month. Upgrade to Pro for unlimited AI Strategist credits.",
          icon: Sparkles,
        }
      case "channels_limit":
        return {
          title: "Connect More Channels",
          description: "Free plan accounts are limited to 3 social media profiles. Upgrade to connect unlimited profiles.",
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
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 z-10"
        >
          {/* Header Graphic */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#30FC47]" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="size-5" />
          </button>

          <div className="p-6 md:p-8">
            {/* Contextual Warning Header */}
            <div className="flex items-start gap-4 border-b border-slate-100 pb-6 dark:border-slate-800">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#30FC47]/10 text-emerald-600 dark:text-emerald-400">
                <DetailIcon className="size-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  GrowWave Lite Limit Trigger
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {details.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
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
                      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#30FC47]/20 text-emerald-600 dark:text-emerald-400 mt-0.5">
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
                    onClick={handleUpgrade}
                    disabled={isUpgrading}
                    className="w-full bg-[#30FC47] hover:bg-[#24D93B] text-slate-900 font-extrabold text-xs py-3 rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 active:scale-95 transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Upgrading...
                      </>
                    ) : (
                      <>
                        <Zap className="size-4 fill-current" />
                        Upgrade Now
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
                    <Shield className="size-3" />
                    30-Day Money Back Guarantee
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
