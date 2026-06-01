"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function MegaMenuLink({
  href,
  icon: Icon,
  title,
  description,
  onNavigate,
}: {
  href: string
  icon: LucideIcon
  title: string
  description: string
  onNavigate?: () => void
}) {
  return (
    <motion.div whileHover={{ x: 2 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          "group flex gap-3 rounded-xl p-3 transition-colors",
          "hover:bg-muted/80 focus-visible:bg-muted/80 focus-visible:outline-none"
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-primary transition-transform group-hover:scale-105">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 text-left">
          <span className="block text-sm font-semibold text-foreground">{title}</span>
          <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
            {description}
          </span>
        </span>
      </Link>
    </motion.div>
  )
}
