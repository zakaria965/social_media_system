"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

const faqs = [
  {
    q: "Can I switch plans anytime?",
    a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate any charges.",
  },
  {
    q: "Is there a free trial?",
    a: "The Free plan is free forever with no time limit. You can explore all basic features without entering a credit card.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual plans.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. There are no contracts or commitments. Cancel anytime from your account settings with no penalties.",
  },
  {
    q: "Is there a discount for annual billing?",
    a: "Yes! Save 20% when you choose annual billing on any paid plan.",
  },
] as const

function FeatureLine({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center gap-3 text-sm text-slate-600">
      <Check className="size-4 shrink-0 text-primary" aria-hidden />
      <span>{children}</span>
    </li>
  )
}

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-primary/[0.06] via-transparent to-transparent" />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 opacity-[0.35]",
            "[background-image:linear-gradient(to_right,hsl(214_32%_91%/0.6)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%/0.6)_1px,transparent_1px)]",
            "[background-size:48px_48px]"
          )}
        />

        <header className="relative mx-auto max-w-3xl px-4 pt-32 text-center md:px-6">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold tracking-wide text-primary uppercase"
          >
            Pricing
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            Flexible pricing for everyone
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            Start free, upgrade when you&apos;re ready
          </motion.p>
        </header>

        <div className="relative mx-auto grid max-w-5xl gap-6 px-4 py-16 md:grid-cols-3 md:gap-8 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <Card className="h-full rounded-2xl border-border/80 bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader>
                <p className="text-lg font-semibold text-foreground">Free</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-semibold text-foreground">$0</span>
                  <span className="text-sm text-muted-foreground">/forever</span>
                </div>
                <p className="text-sm text-muted-foreground">For individuals getting started</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <FeatureLine>Connect up to 3 channels</FeatureLine>
                  <FeatureLine>10 scheduled posts per channel</FeatureLine>
                  <FeatureLine>Basic analytics</FeatureLine>
                  <FeatureLine>Post scheduling</FeatureLine>
                  <FeatureLine>Mobile app access</FeatureLine>
                </ul>
                <Button variant="outline" className="mt-8 w-full rounded-xl" asChild>
                  <Link href="/signup">Get started</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="md:-mt-2"
          >
            <Card className="relative h-full rounded-2xl border-primary/25 bg-gradient-to-b from-white to-green-50/40 shadow-xl shadow-primary/10 ring-1 ring-primary/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <Badge className="absolute -top-3 right-6 rounded-full bg-primary px-3 text-primary-foreground shadow-md">
                Most Popular
              </Badge>
              <CardHeader>
                <p className="text-lg font-semibold text-foreground">Essentials</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-semibold text-foreground">$5</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">For growing creators</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <FeatureLine>Connect up to 8 channels</FeatureLine>
                  <FeatureLine>Unlimited scheduled posts</FeatureLine>
                  <FeatureLine>Advanced analytics</FeatureLine>
                  <FeatureLine>AI Assistant</FeatureLine>
                  <FeatureLine>Start Page / Link-in-bio</FeatureLine>
                  <FeatureLine>Hashtag manager</FeatureLine>
                  <FeatureLine>Best time to post</FeatureLine>
                </ul>
                <Button className="mt-8 w-full rounded-xl shadow-md shadow-primary/25" asChild>
                  <Link href="/signup">Get started</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="h-full rounded-2xl border-border/80 bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader>
                <p className="text-lg font-semibold text-foreground">Team</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-semibold text-foreground">$10</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">For teams and agencies</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <FeatureLine>Everything in Essentials</FeatureLine>
                  <FeatureLine>Connect up to 20 channels</FeatureLine>
                  <FeatureLine>Unlimited team members</FeatureLine>
                  <FeatureLine>Approval workflows</FeatureLine>
                  <FeatureLine>Custom roles &amp; permissions</FeatureLine>
                  <FeatureLine>Priority support</FeatureLine>
                  <FeatureLine>Export reports (PDF/CSV)</FeatureLine>
                </ul>
                <Button variant="outline" className="mt-8 w-full rounded-xl" asChild>
                  <Link href="/signup">Get started</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <section className="mx-auto max-w-3xl px-4 py-16 md:px-6">
          <h2 className="font-display mb-10 text-center text-3xl font-semibold text-foreground">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="w-full rounded-2xl border border-border/80 bg-card/80 px-2 shadow-sm backdrop-blur-sm">
            {faqs.map((item, i) => (
              <AccordionItem key={item.q} value={`item-${i}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>
      <Footer />
    </>
  )
}
