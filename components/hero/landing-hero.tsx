"use client"

import * as React from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  BarChart3,
  CalendarCheck,
  TrendingUp,
  Users,
  Sparkles,
} from "lucide-react"
import {
  IconFacebook,
  IconInstagram,
  IconLinkedin,
  IconX,
  IconYoutube,
  IconTiktok,
  IconPinterest,
  IconThreads,
} from "@/components/social-brand-icons"
import { cn } from "@/lib/utils"

interface FloatIcon {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  className: string
  color: string
  isInstagram?: boolean
  duration: number
}

const floatIcons: readonly FloatIcon[] = [
  // Left side
  { Icon: IconFacebook, className: "left-[3%] top-[15%] w-[80px] h-[80px] md:w-[140px] md:h-[140px]", color: "#1877F2", duration: 10 },
  { Icon: IconInstagram, className: "left-[14%] top-[38%] w-[72px] h-[72px] md:w-[120px] md:h-[120px]", color: "#E1306C", isInstagram: true, duration: 8 },
  { Icon: IconTiktok, className: "left-[5%] bottom-[25%] w-[76px] h-[76px] md:w-[130px] md:h-[130px]", color: "#000000", duration: 9 },
  { Icon: IconThreads, className: "left-[16%] bottom-[8%] w-[72px] h-[72px] md:w-[124px] md:h-[124px]", color: "#000000", duration: 13 },
  // Right side
  { Icon: IconX, className: "right-[3%] top-[16%] w-[80px] h-[80px] md:w-[140px] md:h-[140px]", color: "#000000", duration: 10.5 },
  { Icon: IconLinkedin, className: "right-[14%] top-[40%] w-[76px] h-[76px] md:w-[128px] md:h-[128px]", color: "#0A66C2", duration: 12 },
  { Icon: IconYoutube, className: "right-[5%] bottom-[26%] w-[76px] h-[76px] md:w-[130px] md:h-[130px]", color: "#FF0000", duration: 9.5 },
  { Icon: IconPinterest, className: "right-[16%] bottom-[8%] w-[72px] h-[72px] md:w-[124px] md:h-[124px]", color: "#E60023", duration: 11 },
]

const statsPreview = [
  { icon: BarChart3, label: "Engagement", value: "+48%", color: "text-primary", bg: "bg-primary/10" },
  { icon: Users, label: "Followers", value: "12.4K", color: "text-blue-500", bg: "bg-blue-500/10" },
  { icon: TrendingUp, label: "Reach", value: "84.2K", color: "text-emerald-500", bg: "bg-emerald-500/10" },
]

export function LandingHero() {
  const reduce = useReducedMotion()
  const [email, setEmail] = React.useState("")

  return (
    <section className="relative overflow-hidden px-4 pb-28 pt-28 md:px-6 md:pt-36">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 -z-30",
          "[background-image:linear-gradient(to_right,hsl(214_32%_91%/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%/0.35)_1px,transparent_1px)]",
          "[background-size:48px_48px]"
        )}
      />
      <div className="pointer-events-none absolute inset-0 -z-30 bg-gradient-to-b from-white via-white to-muted/40" />
      <div className="pointer-events-none absolute top-0 left-1/4 -z-20 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/[0.02] blur-3xl" />
      <div className="pointer-events-none absolute top-0 right-1/4 -z-20 h-80 w-80 translate-x-1/2 rounded-full bg-emerald-500/[0.02] blur-3xl" />

      {/* Subtle Glow Behind Headline and Light Green Gradient Accent */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -z-20 h-[350px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-[#30FC47]/8 to-emerald-400/3 blur-[110px] opacity-75 md:w-[700px] md:h-[450px]" />

      {/* Hidden SVG for Instagram Gradient Definitions */}
      <svg className="absolute h-0 w-0 pointer-events-none opacity-0" aria-hidden="true">
        <defs>
          <radialGradient id="ig-radial-grad" cx="30%" cy="107%" r="130%">
            <stop offset="0%" stopColor="#fdf497" />
            <stop offset="5%" stopColor="#fdf497" />
            <stop offset="45%" stopColor="#fd5949" />
            <stop offset="60%" stopColor="#d6249f" />
            <stop offset="90%" stopColor="#285AEB" />
          </radialGradient>
        </defs>
      </svg>

      {!reduce &&
        floatIcons.map(({ Icon, className, color, isInstagram, duration }, i) => {
          return (
            <motion.div
              key={i}
              className={cn(
                "absolute flex items-center justify-center rounded-full border border-black/5 bg-white/90 shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_48px_rgba(0,0,0,0.12)] pointer-events-none md:pointer-events-auto cursor-pointer",
                className
              )}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: [-15, 15, -15] }}
              transition={{
                opacity: { delay: 0.15 + i * 0.05, duration: 0.5 },
                y: {
                  duration: duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            >
              <Icon
                className="w-1/2 h-1/2 opacity-30 transition-opacity duration-300"
                style={{
                  fill: isInstagram ? "url(#ig-radial-grad)" : "currentColor",
                  color: isInstagram ? undefined : color,
                }}
              />
            </motion.div>
          )
        })}

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <Badge
            variant="secondary"
            className="rounded-full border border-primary/15 bg-green-50 px-4 py-1.5 text-primary shadow-sm"
          >
            <Sparkles className="mr-1.5 size-3.5" />
            Social media management, simplified
          </Badge>
        </motion.div>

        <motion.h1
          className="font-display mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        >
          Schedule, publish, and{" "}
          <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
            grow with AI
          </span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45, ease: [0.16, 1, 0.3, 1] as const }}
        >
          Manage all your social media channels from one intelligent workspace.
          <br className="hidden sm:inline" /> Create content, schedule posts, analyze performance,
          and grow your audience faster with AI-powered automation.
        </motion.p>

        <motion.div
          className="mx-auto mt-10 flex max-w-lg flex-col gap-3 sm:flex-row sm:items-center"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.45, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <Input
            type="email"
            placeholder="Work email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-2xl border-border/80 bg-white/90 px-4 shadow-sm backdrop-blur-sm md:flex-1"
          />
          <Button
            size="lg"
            className="h-12 rounded-2xl px-8 shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
            asChild
          >
            <Link href={email ? `/signup?email=${encodeURIComponent(email)}` : "/signup"}>
              Start free
            </Link>
          </Button>
        </motion.div>

        <motion.div
          className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground/90 sm:text-sm"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28, duration: 0.35 }}
        >
          <span className="flex items-center gap-1.5">
            <span className="text-[#30FC47] font-bold">✓</span> No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-[#30FC47] font-bold">✓</span> Connect your social accounts in minutes
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-[#30FC47] font-bold">✓</span> Start publishing immediately
          </span>
        </motion.div>

        <motion.div
          className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-3"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        >
          {[
            { k: "10,000+", l: "Active teams", icon: Users },
            { k: "50M+", l: "Posts scheduled", icon: CalendarCheck },
            { k: "99.9%", l: "Uptime", icon: TrendingUp },
          ].map((s) => (
            <motion.div
              key={s.k}
              whileHover={reduce ? undefined : { y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="rounded-2xl border border-border/70 bg-white/70 p-5 text-center shadow-sm backdrop-blur-md transition-shadow hover:shadow-lg"
            >
              <s.icon className="mx-auto size-5 text-primary/60" />
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {s.k}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.l}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div
        className="mx-auto mt-16 max-w-3xl px-4"
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {statsPreview.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
              whileHover={reduce ? undefined : { y: -3 }}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition-all hover:shadow-md"
            >
              <div className={cn("flex size-10 items-center justify-center rounded-xl", stat.bg)}>
                <stat.icon className={cn("size-5", stat.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={cn("text-lg font-semibold", stat.color)}>{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="mt-20"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.45 }}
      >
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          Trusted by creators & brands on
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 px-4 md:gap-x-12">
          {[
            { name: "Meta", Icon: IconFacebook },
            { name: "LinkedIn", Icon: IconLinkedin },
            { name: "TikTok", Icon: IconTiktok },
            { name: "YouTube", Icon: IconYoutube },
            { name: "Pinterest", Icon: IconPinterest },
            { name: "X", Icon: IconX },
          ].map((brand) => (
            <motion.div
              key={brand.name}
              whileHover={reduce ? undefined : { scale: 1.05 }}
              className="flex items-center gap-2 text-muted-foreground/45 transition-colors hover:text-muted-foreground/85 cursor-pointer"
            >
              <brand.Icon className="size-5 md:size-6" />
              <span className="text-sm font-semibold tracking-wide">{brand.name}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
