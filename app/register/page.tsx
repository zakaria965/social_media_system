"use client"

import { Suspense, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { RegisterForm } from "@/components/auth/register-form"
import { motion } from "framer-motion"

function RegisterContent() {
  const router = useRouter()
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""

  useEffect(() => {
    if (session?.user) {
      router.push("/dashboard")
    }
  }, [session, router])

  if (session?.user) return null

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative flex items-center justify-center bg-gradient-to-br from-primary to-emerald-700 px-8 py-16 lg:w-[38%] lg:min-h-screen">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute inset-0 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center text-primary-foreground"
        >
          <Link href="/" className="inline-block">
            <p className="font-display text-4xl font-semibold tracking-tight lg:text-5xl">
              GrowWave
            </p>
          </Link>
          <p className="mt-3 max-w-sm text-balance text-lg text-primary-foreground/80">
            Register to unlock scheduling, analytics, and AI drafting in one place.
          </p>
          <div className="mx-auto mt-8 max-w-xs space-y-3 text-left text-sm text-primary-foreground/70">
            {[
              "Multi-platform scheduling",
              "AI content generation",
              "Engagement analytics",
              "Team workspace",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-primary-foreground/50" />
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4 py-12 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-8 shadow-lg"
        >
          <div className="text-center lg:text-left">
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Register
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Create your GrowWave account
            </p>
          </div>
          <div className="mt-8">
            <RegisterForm defaultEmail={email} />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  )
}
