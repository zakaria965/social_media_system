"use client"

import * as React from "react"
import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "error" | "info"

type ToastState = { id: number; message: string; type: ToastType } | null

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null)
  const [id, setId] = useState(0)

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const nextId = id + 1
    setId(nextId)
    setToast({ id: nextId, message, type })
    window.setTimeout(() => setToast((t) => (t?.id === nextId ? null : t)), 3200)
  }, [id])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          role="status"
          className={cn(
            "fixed right-6 bottom-6 z-[100] rounded-lg px-5 py-3 text-sm text-white shadow-lg",
            toast.type === "success" && "bg-primary",
            toast.type === "error" && "bg-destructive",
            toast.type === "info" && "bg-blue-500"
          )}
        >
          {toast.message}
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return ctx
}
