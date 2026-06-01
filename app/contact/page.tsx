"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Clock, Mail, MapPin, Phone } from "lucide-react"
import { IconFacebook, IconInstagram, IconLinkedin, IconX, IconYoutube } from "@/components/social-brand-icons"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ContactForm } from "@/components/contact-form"
import { cn } from "@/lib/utils"

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden pb-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-gradient-to-b from-emerald-500/[0.07] via-transparent to-transparent" />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 opacity-[0.35]",
            "[background-image:linear-gradient(to_right,hsl(214_32%_91%/0.6)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%/0.6)_1px,transparent_1px)]",
            "[background-size:48px_48px]"
          )}
        />

        <header className="relative mx-auto max-w-3xl px-4 pt-32 text-center md:px-6">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold tracking-wide text-primary uppercase"
          >
            Contact
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            Get in touch
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            We&apos;d love to hear from you
          </motion.p>
        </header>

        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-2 md:gap-16 md:px-6">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="rounded-2xl border border-border/80 bg-white/80 p-8 shadow-sm backdrop-blur-md"
          >
            <p className="text-2xl font-semibold text-foreground">GrowWave</p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              GrowWave is a modern social media management platform built to help creators, businesses,
              and teams grow their online presence. We believe in making social media simple, consistent,
              and effective.
            </p>

            <div className="mt-8 flex flex-col gap-6">
              {[
                {
                  icon: MapPin,
                  title: "Address",
                  text: "123 Innovation Drive, Suite 400, San Francisco, CA 94107, United States",
                },
                {
                  icon: Phone,
                  title: "Phone",
                  text: "+1 (555) 123-4567 · +1 (555) 987-6543",
                },
                {
                  icon: Mail,
                  title: "Email",
                  text: "hello@growwave.com · support@growwave.com",
                },
                {
                  icon: Clock,
                  title: "Business Hours",
                  text: "Monday – Friday: 9:00 AM – 6:00 PM (PST)",
                },
              ].map((row) => {
                const RowIcon = row.icon
                return (
                  <div key={row.title} className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                      <RowIcon className="size-5 text-primary" aria-hidden />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{row.title}</p>
                      <p className="text-sm text-muted-foreground">{row.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8">
              <p className="mb-3 text-sm font-semibold text-foreground">Follow us</p>
              <div className="flex flex-wrap gap-2">
                {[IconFacebook, IconInstagram, IconX, IconLinkedin, IconYoutube].map((Icon, idx) => (
                  <Link
                    key={idx}
                    href="#"
                    className="flex size-10 items-center justify-center rounded-full border border-border transition-all hover:border-primary hover:bg-green-100 hover:text-primary"
                  >
                    <Icon className="size-4" aria-hidden />
                  </Link>
                ))}
              </div>
            </div>

            <Image
              src="https://picsum.photos/seed/growwave-office/600/400.jpg"
              alt="GrowWave office"
              width={600}
              height={400}
              className="mt-8 h-auto w-full rounded-2xl object-cover shadow-md ring-1 ring-border/60"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <ContactForm />
          </motion.div>
        </div>

        <div className="mx-auto mt-8 max-w-6xl overflow-hidden rounded-2xl border border-border/80 bg-muted/60 px-4 md:px-6">
          <div className="flex h-80 flex-col items-center justify-center gap-2 text-center">
            <MapPin className="size-10 text-muted-foreground" aria-hidden />
            <p className="text-sm font-semibold text-foreground">San Francisco, CA</p>
            <p className="text-xs text-muted-foreground">Map preview</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
