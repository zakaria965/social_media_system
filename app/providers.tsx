"use client"

import { SessionProvider } from "next-auth/react"
import { ToastProvider } from "@/components/toast-provider"
import { ThemeProvider } from "@/components/dashboard/theme-provider"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
