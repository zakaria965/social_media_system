"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import {
  BarChart3,
  Calendar,
  Link2,
  Pencil,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CTASection } from "@/components/cta-section"
import { LandingHero } from "@/components/hero/landing-hero"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const sectionMotion = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
}

export default function HomePage() {
  const reduce = useReducedMotion()

  return (
    <>
      <Navbar />
      <main className="relative">
        <LandingHero />

        <section className="relative px-4 py-20 md:px-6">
          <div
            className={cn(
              "pointer-events-none absolute inset-0 -z-10 opacity-40",
              "[background-image:linear-gradient(to_right,hsl(214_32%_91%/0.5)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%/0.5)_1px,transparent_1px)]",
              "[background-size:48px_48px]"
            )}
          />
          <motion.div
            {...(reduce ? {} : sectionMotion)}
            className="mx-auto max-w-5xl text-center"
          >
            <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
              How it works
            </h2>
            <div className="mx-auto mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Link2,
                  title: "Connect",
                  desc: "Link your social media accounts in seconds",
                },
                {
                  icon: Pencil,
                  title: "Create",
                  desc: "Draft and schedule content with AI assistance",
                },
                {
                  icon: TrendingUp,
                  title: "Grow",
                  desc: "Track performance and scale your presence",
                },
              ].map((step) => {
                const StepIcon = step.icon
                return (
                <motion.div
                  key={step.title}
                  whileHover={reduce ? undefined : { y: -4 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                >
                  <Card className="h-full rounded-2xl border-0 bg-white/80 shadow-card hover:shadow-card-hover backdrop-blur-md transition-all">
                    <CardHeader className="items-center text-center">
                      <div className="flex size-12 items-center justify-center rounded-full bg-green-100">
                        <StepIcon className="size-6 text-primary" aria-hidden />
                      </div>
                      <CardTitle className="font-display mt-3 text-xl">{step.title}</CardTitle>
                      <CardDescription className="text-base">{step.desc}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
                )
              })}
            </div>
          </motion.div>
        </section>

        <section className="bg-muted/50 px-4 py-20 md:px-6">
          <motion.div
            {...(reduce ? {} : sectionMotion)}
            className="mx-auto max-w-5xl"
          >
            <h2 className="font-display text-center text-3xl font-semibold text-foreground md:text-4xl">
              Everything you need
            </h2>
            <div className="mx-auto mt-12 grid gap-6 md:grid-cols-2">
              {[
                {
                  icon: Calendar,
                  title: "Schedule Posts",
                  desc: "Plan and publish content across all your channels at the perfect time",
                },
                {
                  icon: BarChart3,
                  title: "Analytics Dashboard",
                  desc: "Deep insights into your performance with beautiful visual reports",
                },
                {
                  icon: Sparkles,
                  title: "AI Content Assistant",
                  desc: "Generate captions, hashtags, and post ideas in seconds",
                },
                {
                  icon: Users,
                  title: "Team Collaboration",
                  desc: "Assign tasks, review drafts, and approve content together",
                },
              ].map((item) => {
                const ItemIcon = item.icon
                return (
                <motion.div
                  key={item.title}
                  whileHover={reduce ? undefined : { y: -3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                >
                  <Card className="h-full rounded-2xl border-0 bg-card p-8 shadow-card hover:shadow-card-hover transition-all">
                    <CardHeader className="p-0">
                      <div className="flex size-12 items-center justify-center rounded-full bg-green-100">
                        <ItemIcon className="size-6 text-primary" aria-hidden />
                      </div>
                      <CardTitle className="font-display mt-4 text-xl">{item.title}</CardTitle>
                      <CardDescription className="text-base leading-relaxed">
                        {item.desc}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
                )
              })}
            </div>
            <div className="mt-10 text-center">
              <Button variant="link" className="font-medium text-primary" asChild>
                <Link href="/features">Explore all features →</Link>
              </Button>
            </div>
          </motion.div>
        </section>

        <motion.div {...(reduce ? {} : sectionMotion)}>
          <CTASection />
        </motion.div>
      </main>
      <Footer />
    </>
  )
}
