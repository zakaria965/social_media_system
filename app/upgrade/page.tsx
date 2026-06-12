"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/toast-provider"
import { Zap, Check, Shield, CreditCard, Loader2, Sparkles, ArrowLeft } from "lucide-react"
import Link from "next/link"

function UpgradeContent() {
  const { data: session, status, update } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { showToast } = useToast()

  const reason = searchParams.get("reason")
  
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly")
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [step, setStep] = useState<"checkout" | "success">("checkout")

  // Checkout Form State
  const [cardName, setCardName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvc, setCardCvc] = useState("")
  const [cardZip, setCardZip] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isUpgrading) return

    if (!cardName || !cardNumber || !cardExpiry || !cardCvc || !cardZip) {
      showToast("Please fill in all credit card details.", "error")
      return
    }

    setIsUpgrading(true)
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
      
      setStep("success")
      showToast("Payment Processed Successfully!", "success")
    } catch (err: any) {
      console.error(err)
      showToast(err.message || "An unexpected error occurred during upgrade.", "error")
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleFinishUpgrade = async () => {
    setIsUpgrading(true)
    try {
      await update()
      router.push("/dashboard")
    } catch (err) {
      console.error("Error updating session:", err)
      window.location.assign("/dashboard")
    } finally {
      setIsUpgrading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FCFAF6]">
        <Loader2 className="size-6 text-brand-green animate-spin" />
      </div>
    )
  }

  const proFeatures = [
    { title: "Unlimited Social Channels", desc: "Connect Facebook, Instagram, LinkedIn, TikTok, Twitter/X" },
    { title: "Advanced AI Copilot", desc: "Unlimited credits, conversational brainstorming, performance insights" },
    { title: "Unlimited Scheduled Posts", desc: "No caps on drafts or scheduled queues" },
    { title: "Advanced Analytics Reports", desc: "Audience demographics, heatmaps, PDF reports" },
    { title: "Team Collaboration", desc: "Add team members, custom roles, draft approvals" },
    { title: "Unified Social Inbox", desc: "Manage comments, DMs, and reviews in one inbox" },
  ]

  return (
    <div className="min-h-screen bg-[#FCFAF6] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-4xl w-full grid gap-8 md:grid-cols-12 bg-white rounded-2xl p-6 md:p-8 shadow-card border border-[#EEF2F7]">
        {/* Left Side: Benefits */}
        <div className="md:col-span-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-green transition-colors">
              <ArrowLeft className="size-3.5" /> Back to Home
            </Link>

            {reason === "team" ? (
              <div className="rounded-xl bg-[#F0FDF4] p-4 border border-[#22C55E]/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#22C55E]">Premium Feature Alert</span>
                <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                  Team Management is available on GrowWave Pro.
                </h2>
                <p className="text-xs text-slate-500 leading-normal mt-1">
                  Invite collaborators, define client approval matrices, assign publishing tasks, and lock campaign calendars with team workspaces.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#22C55E]">Scale Your Presence</span>
                <h2 className="text-2xl font-black text-slate-900">Upgrade to GrowWave Pro</h2>
                <p className="text-xs text-slate-500 leading-normal">
                  Unlock the full power of social media marketing tools and team collaboration.
                </p>
              </div>
            )}

            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pro Subscription Features:
              </h4>
              <ul className="space-y-3.5">
                {proFeatures.map((f, i) => (
                  <li key={i} className="flex gap-2.5 items-start">
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#F0FDF4] text-brand-green border border-brand-green/20 mt-0.5">
                      <Check className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">{f.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">{f.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-1 text-[10px] text-slate-400">
            <Shield className="size-3.5 text-[#22C55E]" />
            Secure SSL Checkout • 30-Day Money Back Guarantee
          </div>
        </div>

        {/* Right Side: Checkout Form / Success State */}
        <div className="md:col-span-6 bg-slate-50/50 rounded-xl p-5 border border-[#EEF2F7] flex flex-col justify-between min-h-[400px]">
          {step === "checkout" ? (
            <form onSubmit={handleProcessPayment} className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                {/* Billing Period Switcher */}
                <div className="flex items-center justify-between bg-slate-100 p-0.5 rounded-lg mb-4">
                  <button
                    type="button"
                    onClick={() => setBillingPeriod("monthly")}
                    className={`flex-1 text-[10px] font-bold uppercase py-1.5 rounded-md transition-all ${
                      billingPeriod === "monthly"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingPeriod("yearly")}
                    className={`flex-1 text-[10px] font-bold uppercase py-1.5 rounded-md transition-all relative ${
                      billingPeriod === "yearly"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Yearly
                    <span className="absolute -top-2.5 -right-1.5 bg-[#22C55E] text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-90">
                      -20%
                    </span>
                  </button>
                </div>

                <div className="flex justify-between items-baseline mb-4">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Selected Plan</span>
                    <span className="text-sm font-black text-slate-800">GrowWave Pro</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900">
                      {billingPeriod === "yearly" ? "$19" : "$24"}
                    </span>
                    <span className="text-xs text-slate-400">/mo</span>
                    {billingPeriod === "yearly" && (
                      <span className="text-[9px] text-[#22C55E] font-bold block">Billed annually</span>
                    )}
                  </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-brand-green transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="4111 2222 3333 4444"
                        maxLength={19}
                        required
                        value={cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim()
                          setCardNumber(val)
                        }}
                        className="w-full h-9 rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs outline-none focus:border-brand-green transition-colors"
                      />
                      <CreditCard className="absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Expiry</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                        value={cardExpiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, "")
                          if (val.length > 2) {
                            val = val.substring(0, 2) + "/" + val.substring(2, 4)
                          }
                          setCardExpiry(val)
                        }}
                        className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-center outline-none focus:border-brand-green transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">CVC</label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        required
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))}
                        className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-center outline-none focus:border-brand-green transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Zip</label>
                      <input
                        type="text"
                        placeholder="90210"
                        maxLength={10}
                        required
                        value={cardZip}
                        onChange={(e) => setCardZip(e.target.value)}
                        className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-center outline-none focus:border-brand-green transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpgrading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-lg flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all uppercase tracking-wider mt-4"
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="size-4 fill-current text-amber-400" />
                    Pay & Upgrade Plan
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-6">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 size-16 rounded-full bg-brand-green/10 animate-ping" />
                <div className="size-16 rounded-full bg-brand-green text-white flex items-center justify-center shadow-lg">
                  <Check className="size-8 stroke-[3]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Upgrade Activated</span>
                <h3 className="text-xl font-black text-slate-900">Plan Upgraded Successfully!</h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Welcome to GrowWave Pro. Your session has been updated. You now have unlimited team collaboration limits.
                </p>
              </div>

              <button
                onClick={handleFinishUpgrade}
                disabled={isUpgrading}
                className="w-full max-w-xs bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md uppercase tracking-wider"
              >
                {isUpgrading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    Go to Pro Dashboard
                    <Zap className="size-3.5 fill-current text-amber-400" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#FCFAF6]">
        <Loader2 className="size-6 text-brand-green animate-spin" />
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  )
}
