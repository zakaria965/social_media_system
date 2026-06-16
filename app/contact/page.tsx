"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Clock, Mail, MapPin, Phone, MessageSquare, ShieldCheck, HeartHandshake, Sparkles, Globe, Compass, Calendar, Share2 } from "lucide-react"
import { IconFacebook, IconInstagram, IconLinkedin, IconTiktok } from "@/components/social-brand-icons"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ContactForm } from "@/components/contact-form"
import { cn } from "@/lib/utils"

// A gorgeous custom SaaS illustration representing the GrowWave dashboard
function SaaSIllustration() {
  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-[24px] bg-slate-950 border border-slate-800 shadow-2xl p-6 flex flex-col justify-between select-none">
      {/* Background gradients */}
      <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#30FC47]/15 blur-[60px] pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-emerald-500/10 blur-[60px] pointer-events-none" />
      
      {/* Grid Pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top Section: Dashboard Header Simulation */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500/80" />
            <span className="size-2.5 rounded-full bg-yellow-500/80" />
            <span className="size-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="text-[10px] font-mono text-slate-500 tracking-wider ml-2 uppercase">GrowWave App v2.4</span>
        </div>
        
        {/* Pulsing AI Assistant Indicator */}
        <div className="flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-800 px-2.5 py-1">
          <Sparkles className="size-3 text-[#30FC47] animate-pulse" />
          <span className="text-[10px] font-semibold text-slate-300">AI Assistant Active</span>
        </div>
      </div>

      {/* Center Section: Dashboard Content */}
      <div className="relative z-10 grid grid-cols-5 gap-4 my-auto">
        
        {/* Left Side: Scheduling Mini Widget */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-3 bg-slate-900/90 border border-slate-800/80 p-4 rounded-2xl shadow-lg backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-200">Content Schedule</span>
            <span className="text-[9px] text-[#30FC47] font-semibold">84% Engagement</span>
          </div>
          
          {/* Scheduled posts list */}
          <div className="space-y-2">
            {[
              { time: "10:00 AM", status: "Published", platform: "LinkedIn", title: "Why AI is the future of SaaS" },
              { time: "02:30 PM", status: "Scheduled", platform: "Instagram", title: "GrowWave product upgrade reveal" },
              { time: "05:00 PM", status: "Draft", platform: "TikTok", title: "Quick tips for creators" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-950/60 border border-slate-850 p-2 rounded-xl text-[10px]">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "size-2 rounded-full",
                    item.status === "Published" ? "bg-[#30FC47]" : item.status === "Scheduled" ? "bg-amber-400" : "bg-slate-500"
                  )} />
                  <span className="font-semibold text-slate-300">{item.time}</span>
                  <span className="text-slate-400 truncate max-w-[100px]">{item.title}</span>
                </div>
                <span className="text-[8px] text-slate-500 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {item.platform}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Side: Analytics & Social Graph Widget */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-2 bg-slate-900/90 border border-slate-800/80 p-4 rounded-2xl shadow-lg backdrop-blur-sm flex flex-col justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-slate-200 block">Audience Growth</span>
            <span className="text-[18px] font-bold text-slate-100 tracking-tight mt-1 block">+12.4k</span>
          </div>

          {/* Simple Sparkline SVG representing GrowWave graph */}
          <div className="h-12 w-full mt-2">
            <svg viewBox="0 0 100 30" className="h-full w-full overflow-visible">
              <defs>
                <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#30FC47" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#30FC47" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path
                d="M0,25 Q15,10 30,22 T60,5 T90,15 L100,10 L100,30 L0,30 Z"
                fill="url(#waveGrad)"
              />
              <path
                d="M0,25 Q15,10 30,22 T60,5 T90,15 L100,10"
                fill="none"
                stroke="#30FC47"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Dot indicator */}
              <circle cx="100" cy="10" r="3" fill="#30FC47" />
              <circle cx="100" cy="10" r="5" fill="#30FC47" className="animate-ping" style={{ transformOrigin: '100px 10' }} />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[8px] text-slate-500 mt-2 font-mono">
            <span>May 1</span>
            <span>Jun 16 (Today)</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Section: Floating Brand Platform Badges */}
      <div className="relative z-10 flex justify-around items-center border-t border-slate-800/80 pt-4 bg-slate-950/80">
        {[
          { icon: IconFacebook, color: "text-[#1877F2]", bg: "bg-[#1877F2]/10", border: "border-[#1877F2]/20", name: "Facebook" },
          { icon: IconInstagram, color: "text-[#E1306C]", bg: "bg-[#E1306C]/10", border: "border-[#E1306C]/20", name: "Instagram" },
          { icon: IconLinkedin, color: "text-[#0A66C2]", bg: "bg-[#0A66C2]/10", border: "border-[#0A66C2]/20", name: "LinkedIn" },
          { icon: IconTiktok, color: "text-[#00F2FE]", bg: "bg-[#00F2FE]/10", border: "border-[#00F2FE]/20", name: "TikTok" }
        ].map((platform, idx) => {
          const PlatformIcon = platform.icon
          return (
            <motion.div
              key={idx}
              animate={{
                y: [0, -6, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: idx * 0.8,
                ease: "easeInOut"
              }}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-semibold backdrop-blur-sm shadow-sm", platform.bg, platform.border, platform.color)}
            >
              <PlatformIcon className="size-3.5 fill-current" />
              <span>{platform.name}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="relative min-h-screen pb-24 bg-[#FCFAF6] text-[#111827] font-sans antialiased overflow-hidden">
        {/* Soft background accents */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-[#30FC47]/[0.08] via-transparent to-transparent" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: `linear-gradient(to right, #EEF2F7 1px, transparent 1px), linear-gradient(to bottom, #EEF2F7 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />

        {/* HERO SECTION */}
        <header className="relative mx-auto max-w-4xl px-4 pt-36 text-center md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#30FC47]/10 border border-[#30FC47]/20 px-3.5 py-1 text-xs font-semibold text-emerald-800"
          >
            <Compass className="size-3.5 text-emerald-600 animate-spin" style={{ animationDuration: '60s' }} />
            GrowWave Global Center
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-4xl font-extrabold tracking-tight text-[#111827] sm:text-5xl md:text-6xl"
          >
            Let&apos;s Grow Together
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-lg md:text-xl text-[#64748B] leading-relaxed"
          >
            Questions, partnerships, support requests, and business inquiries. Our team is ready to help.
          </motion.p>
        </header>

        {/* QUICK CONTACT CARDS */}
        <section className="relative mx-auto max-w-6xl px-4 pt-16 md:px-6">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[
              { title: "Support", desc: "Get technical help", icon: MessageSquare, border: "hover:border-blue-400/50" },
              { title: "Sales", desc: "Talk about GrowWave plans", icon: ShieldCheck, border: "hover:border-emerald-400/50" },
              { title: "Partnerships", desc: "Business opportunities", icon: HeartHandshake, border: "hover:border-purple-400/50" },
              { title: "Feedback", desc: "Share ideas and suggestions", icon: Sparkles, border: "hover:border-amber-400/50" }
            ].map((card, idx) => {
              const CardIcon = card.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  className={cn(
                    "bg-white p-5 rounded-[16px] shadow-[0_4px_12px_rgba(15,23,42,0.03)] border border-[#EEF2F7] transition-all duration-300 hover:shadow-[0_10px_20px_rgba(15,23,42,0.06)] hover:-translate-y-0.5",
                    card.border
                  )}
                >
                  <div className="size-10 rounded-xl bg-[#FCFAF6] flex items-center justify-center border border-[#EEF2F7]">
                    <CardIcon className="size-5 text-slate-800" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-[#111827]">{card.title}</h3>
                  <p className="mt-1.5 text-xs text-[#64748B] leading-relaxed">{card.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* MAIN FORM & INFORMATION SECTION */}
        <section className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:gap-16 md:px-6">
          {/* Left Side: Info & Professional Visual Illustration */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="flex flex-col gap-8 justify-between"
          >
            <div className="bg-white p-8 rounded-[16px] shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] border border-[#EEF2F7]">
              <div className="flex items-center justify-between pb-6 border-b border-[#EEF2F7]">
                <div>
                  <p className="text-xl font-extrabold text-[#111827]">GrowWave HQ</p>
                  <p className="text-xs font-semibold text-emerald-600 mt-1 uppercase tracking-wider">Communication Hub</p>
                </div>
                {/* Live Status Card */}
                <div className="bg-[#30FC47]/10 border border-[#30FC47]/20 rounded-xl px-4 py-2 text-right">
                  <div className="flex items-center gap-1.5 justify-end text-xs font-bold text-emerald-800">
                    <span className="relative flex size-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full size-2 bg-[#30FC47]"></span>
                    </span>
                    Support Online
                  </div>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Response: Under 24h</p>
                </div>
              </div>

              {/* Direct Info Fields */}
              <div className="mt-6 space-y-5">
                {[
                  {
                    icon: MapPin,
                    title: "Address",
                    content: "Somaliland hargeisa",
                    desc: "East Africa · Global Digital HQ"
                  },
                  {
                    icon: Phone,
                    title: "Phone Numbers",
                    content: "+252 63 7157032",
                    desc: "+252 67 2032217 · Direct Sales & Support"
                  },
                  {
                    icon: Mail,
                    title: "Official Email Communication",
                    content: "support@growwave.com",
                    desc: "Sales: sales@growwave.com · Partnerships: partners@growwave.com"
                  },
                  {
                    icon: Clock,
                    title: "Support Hours",
                    content: "Anytime",
                    desc: "24/7 Online Support available worldwide"
                  }
                ].map((item, idx) => {
                  const InfoIcon = item.icon
                  return (
                    <div key={idx} className="flex gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FCFAF6] border border-[#EEF2F7] text-slate-800">
                        <InfoIcon className="size-4.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{item.title}</p>
                        <p className="text-sm font-bold text-[#111827] mt-0.5">{item.content}</p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Custom Interactive SaaS illustration */}
            <SaaSIllustration />
          </motion.div>

          {/* Right Side: Contact Form Card */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <ContactForm />
          </motion.div>
        </section>

        {/* GLOBAL MAP PREVIEW BANNER */}
        <section className="mx-auto mt-6 max-w-6xl px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[24px] border border-[#EEF2F7] bg-white p-8 md:p-12 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] text-center"
          >
            {/* Soft decorative visual elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none size-[400px] bg-[#30FC47]/5 rounded-full blur-[80px]" />
            
            <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
              <div className="flex size-12 items-center justify-center rounded-full bg-[#FCFAF6] border border-[#EEF2F7] mb-6">
                <Globe className="size-6 text-emerald-600 animate-spin" style={{ animationDuration: '10s' }} />
              </div>
              <h3 className="text-2xl font-extrabold text-[#111827] tracking-tight">🌍 Global Digital Platform</h3>
              <p className="mt-3 text-sm md:text-base text-[#64748B] leading-relaxed">
                Serving creators, businesses, and agencies worldwide. We believe in providing unified, powerful automation tools regardless of your geographic location.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs font-semibold text-slate-800">
                <span className="bg-[#FCFAF6] border border-[#EEF2F7] px-3 py-1.5 rounded-full">Headquartered in Hargeisa, Somaliland</span>
                <span className="bg-[#FCFAF6] border border-[#EEF2F7] px-3 py-1.5 rounded-full">Global Data Pipelines</span>
                <span className="bg-[#FCFAF6] border border-[#EEF2F7] px-3 py-1.5 rounded-full">Support Hours: 24/7</span>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
      <Footer />
    </>
  )
}
