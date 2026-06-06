"use client"

import * as React from "react"
import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, AlertCircle, Info } from "lucide-react"

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
    window.setTimeout(() => setToast((t) => (t?.id === nextId ? null : t)), 3000)
  }, [id])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          role="status"
          className={cn(
            "fixed right-6 bottom-6 z-[100] flex items-center gap-2.5 rounded-xl px-4 py-3.5 text-xs font-bold text-white shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 border border-white/10 backdrop-blur-md",
            toast.type === "success" && "bg-[#30FC47]",
            toast.type === "error" && "bg-rose-600",
            toast.type === "info" && "bg-slate-900/90 dark:bg-slate-800/90"
          )}
        >
          {toast.type === "success" && <CheckCircle2 className="size-4 shrink-0" />}
          {toast.type === "error" && <AlertCircle className="size-4 shrink-0" />}
          {toast.type === "info" && <Info className="size-4 shrink-0" />}
          <span>{toast.message}</span>
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

