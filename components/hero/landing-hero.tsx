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
} from "@/components/social-brand-icons"
import { cn } from "@/lib/utils"

const floatIcons = [
  { Icon: IconInstagram, className: "left-[6%] top-[18%] size-14 md:size-16" },
  { Icon: IconX, className: "right-[8%] top-[22%] size-12 md:size-14" },
  { Icon: IconFacebook, className: "left-[12%] bottom-[26%] size-11 md:size-12" },
  { Icon: IconLinkedin, className: "right-[14%] bottom-[20%] size-12 md:size-14" },
  { Icon: IconYoutube, className: "left-1/2 top-[8%] size-10 -translate-x-1/2 md:size-12" },
] as const

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
          "pointer-events-none absolute inset-0 -z-10",
          "[background-image:linear-gradient(to_right,hsl(214_32%_91%/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%/0.35)_1px,transparent_1px)]",
          "[background-size:48px_48px]"
        )}
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white via-white to-muted/40" />
      <div className="pointer-events-none absolute top-0 left-1/4 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/[0.03] blur-3xl" />
      <div className="pointer-events-none absolute top-0 right-1/4 -z-10 h-80 w-80 translate-x-1/2 rounded-full bg-emerald-500/[0.03] blur-3xl" />

      {!reduce &&
        floatIcons.map(({ Icon, className }, i) => (
          <motion.div
            key={i}
            className={cn("pointer-events-none absolute text-muted-foreground/20", className)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: [0, -6, 0] }}
            transition={{
              opacity: { delay: 0.15 + i * 0.05, duration: 0.5 },
              y: { duration: 4 + i * 0.4, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <Icon className="size-full drop-shadow-sm" />
          </motion.div>
        ))}

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
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45, ease: [0.16, 1, 0.3, 1] as const }}
        >
          Plan, publish, and measure like a modern team — without the noise. Built for creators and
          brands who want Buffer-level clarity with AI-native speed across every platform.
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

        <motion.p
          className="mt-3 text-xs text-muted-foreground"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28, duration: 0.35 }}
        >
          No credit card required · Cancel anytime
        </motion.p>

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
        className="mt-16"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.45 }}
      >
        <p className="text-center text-sm font-medium text-muted-foreground">
          Trusted by modern teams
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              whileHover={reduce ? undefined : { scale: 1.03 }}
              className="flex h-10 w-24 items-center justify-center rounded-xl border border-border/60 bg-white/80 text-xs font-semibold text-muted-foreground/80 shadow-sm backdrop-blur-sm md:h-11 md:w-28"
            >
              Logo
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
