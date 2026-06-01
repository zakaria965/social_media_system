"use client"

import { motion } from "framer-motion"
import {
  BarChart3,
  Lightbulb,
  Link as LinkIcon,
  MessageCircle,
  Send,
  Sparkles,
  Users,
} from "lucide-react"
import Link from "next/link"
import { MegaMenuLink } from "@/components/dropdowns/mega-menu-link"
import { Button } from "@/components/ui/button"

const left = [
  {
    href: "/features#create",
    icon: Lightbulb,
    title: "Create",
    description: "Ideas, drafts, templates, and your creative workflow in one place.",
  },
  {
    href: "/features#analyze",
    icon: BarChart3,
    title: "Analyze",
    description: "Engagement, reach, and growth reports you can act on.",
  },
  {
    href: "/features#collaborate",
    icon: Users,
    title: "Collaborate",
    description: "Assign, review, and approve content with your team.",
  },
  {
    href: "/features#ai",
    icon: Sparkles,
    title: "AI Assistant",
    description: "Captions, hashtags, and repurposing in seconds.",
  },
] as const

const right = [
  {
    href: "/features#publish",
    icon: Send,
    title: "Publish",
    description: "Schedule and publish across every channel reliably.",
  },
  {
    href: "/features#community",
    icon: MessageCircle,
    title: "Community",
    description: "Comments, messages, and mentions in one inbox.",
  },
  {
    href: "/features#start-page",
    icon: LinkIcon,
    title: "Start Page",
    description: "A polished link-in-bio that converts visitors.",
  },
] as const

export function FeaturesMegaMenu({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
      className="border-border/80 bg-background/95 supports-[backdrop-filter]:bg-background/80 shadow-2xl backdrop-blur-2xl mx-4 rounded-2xl border p-6 md:mx-auto md:max-w-5xl"
    >
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Build &amp; optimize
          </p>
          <div className="mt-3 flex flex-col gap-1">
            {left.map((item) => (
              <MegaMenuLink key={item.title} {...item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Publish &amp; engage
          </p>
          <div className="mt-3 flex flex-col gap-1">
            {right.map((item) => (
              <MegaMenuLink key={item.title} {...item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5">
        <p className="text-sm text-muted-foreground">Want the full tour?</p>
        <Button asChild size="sm" className="rounded-full shadow-sm">
          <Link href="/features" onClick={onNavigate}>
            View all features
          </Link>
        </Button>
      </div>
    </motion.div>
  )
}
