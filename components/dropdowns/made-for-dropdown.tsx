"use client"

import { motion } from "framer-motion"
import {
  User,
  Building2,
  GraduationCap,
  Store,
  Heart,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const items = [
  {
    col: "left",
    href: "#",
    icon: User,
    title: "Creators",
    description: "Grow your community with confidence",
  },
  {
    col: "left",
    href: "#",
    icon: Building2,
    title: "Agencies",
    description: "Run every client social with clarity",
  },
  {
    col: "left",
    href: "#",
    icon: GraduationCap,
    title: "Higher Education",
    description: "Social media management for schools and universities",
  },
  {
    col: "right",
    href: "#",
    icon: Store,
    title: "Small Business",
    description: "A simpler way to manage social media",
  },
  {
    col: "right",
    href: "#",
    icon: Heart,
    title: "Nonprofits",
    description: "Made for small teams doing big things",
  },
] as const

export function MadeForDropdown({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
      className="border-border/80 bg-background/95 supports-[backdrop-filter]:bg-background/80 shadow-2xl backdrop-blur-2xl mx-4 rounded-2xl border p-5 md:mx-auto md:max-w-2xl"
    >
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase px-1">
        Who is GrowWave for
      </p>
      <div className="mt-3 grid gap-1 md:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.title}
              whileHover={{ x: 2 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex gap-3 rounded-xl p-3 transition-all",
                  "hover:bg-muted/80 focus-visible:bg-muted/80 focus-visible:outline-none"
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-primary shadow-sm transition-all group-hover:scale-105 group-hover:shadow-md">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                  <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
