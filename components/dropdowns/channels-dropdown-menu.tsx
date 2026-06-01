"use client"

import { motion } from "framer-motion"
import { Phone } from "lucide-react"
import Link from "next/link"
import {
  IconFacebook,
  IconInstagram,
  IconLinkedin,
  IconX,
} from "@/components/social-brand-icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const channels = [
  {
    name: "Facebook",
    href: "/channels",
    bg: "bg-[#1877F2]",
    icon: IconFacebook,
  },
  {
    name: "Instagram",
    href: "/channels",
    bg: "bg-gradient-to-br from-[#E4405F] to-[#833AB4]",
    icon: IconInstagram,
  },
  {
    name: "X / Twitter",
    href: "/channels",
    bg: "bg-black",
    icon: IconX,
  },
  {
    name: "LinkedIn",
    href: "/channels",
    bg: "bg-[#0A66C2]",
    icon: IconLinkedin,
  },
  {
    name: "WhatsApp",
    href: "/channels",
    bg: "bg-[#25D366]",
    icon: Phone,
  },
] as const

export function ChannelsDropdownMenu({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
      className="border-border/80 bg-background/95 supports-[backdrop-filter]:bg-background/80 shadow-2xl backdrop-blur-2xl mx-4 rounded-2xl border p-5 md:mx-auto md:max-w-xl"
    >
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Connect your channels
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {channels.map((c) => {
          const Icon = c.icon
          return (
            <motion.div
              key={c.name}
              whileHover={{ y: -2, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
            >
              <Link
                href={c.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3",
                  "transition-all hover:shadow-lg hover:border-border/80"
                )}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg text-white shadow-sm",
                    c.bg
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="text-sm font-medium text-foreground">{c.name}</span>
              </Link>
            </motion.div>
          )
        })}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        <p className="text-sm text-muted-foreground">Manage publishing in one workspace.</p>
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link href="/channels" onClick={onNavigate}>
            Open channels
          </Link>
        </Button>
      </div>
    </motion.div>
  )
}
