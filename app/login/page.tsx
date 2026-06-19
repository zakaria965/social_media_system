"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { LoginForm } from "@/components/auth/login-form"
import { motion } from "framer-motion"
import { Suspense } from "react"

function LoginContent() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const message = searchParams.get("message")

  React.useEffect(() => {
    if (session?.user) {
      if (session.user.role === "ADMIN") {
        router.push("/admin")
        return
      }

      fetch("/api/workspaces")
        .then((res) => res.json())
        .then((data) => {
          const memberships = data.memberships || []
          if (memberships.length > 0) {
            const invited = memberships.find((m: any) => m.role !== "owner" && m.role !== "Workspace Owner")
            const target = invited || memberships[0]
            router.push(`/workspace/${target.workspaceId}`)
          } else {
            if (session.user.plan === "PRO") {
              router.push("/dashboard")
            } else {
              router.push("/dashboard-lite")
            }
          }
        })
        .catch((err) => {
          console.error(err)
          router.push("/dashboard-lite")
        })
    }
  }, [session, router])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (session?.user) {
    return null
  }

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
          <p className="font-display text-4xl font-semibold tracking-tight lg:text-5xl">
            GrowWave
          </p>
          <p className="mt-3 max-w-sm text-balance text-lg text-primary-foreground/80">
            The modern workspace for consistent, measurable social growth.
          </p>
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
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground mb-6">
              Sign in to your GrowWave account
            </p>
          </div>
          
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center text-xs font-semibold text-emerald-800 shadow-sm"
            >
              {message}
            </motion.div>
          )}

          <div className="mt-2">
            <LoginForm />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
