"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-emerald-600 to-emerald-700 py-24 text-center text-primary-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute inset-0 [background-image:radial-gradient(circle_at_30%_20%,white,transparent_50%),radial-gradient(circle_at_80%_60%,white,transparent_45%)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as const }}
        className="relative mx-auto max-w-2xl px-4"
      >
        <Sparkles className="mx-auto size-8 text-primary-foreground/50" />
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Ready to grow your social presence?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-primary-foreground/70">
          Join thousands of teams who use GrowWave to plan, publish, and measure their social media.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="rounded-2xl border-0 bg-white px-8 text-primary shadow-lg shadow-black/10 transition-all hover:bg-green-50 hover:-translate-y-0.5 hover:shadow-xl"
            asChild
          >
            <Link href="/signup">
              Get started for free
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-2xl border-primary-foreground/30 bg-transparent px-8 text-primary-foreground shadow-lg transition-all hover:bg-white/10 hover:-translate-y-0.5"
            asChild
          >
            <Link href="/contact">Talk to sales</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-primary-foreground/60">No credit card required · Free 14-day trial</p>
      </motion.div>
    </section>
  )
}
