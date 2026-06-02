"use client"

import { SessionProvider } from "next-auth/react"
import { ToastProvider } from "@/components/toast-provider"
import { ThemeProvider } from "@/components/dashboard/theme-provider"
import { WorkspaceProvider } from "@/components/dashboard/workspace-provider"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <WorkspaceProvider>
          <ToastProvider>{children}</ToastProvider>
        </WorkspaceProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
