"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, AlertTriangle, Info, Loader2, X } from "lucide-react"

interface GrowWaveModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  variant?: "danger" | "error" | "info"
  loading?: boolean
  loadingText?: string
}

export function GrowWaveModal({
  isOpen,
  onClose,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "info",
  loading = false,
  loadingText = "Loading..."
}: GrowWaveModalProps) {
  
  // Disable background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <AlertTriangle className="size-6 text-rose-500" />
      case "error":
        return <AlertCircle className="size-6 text-rose-500" />
      default:
        return <Info className="size-6 text-slate-500" />
    }
  }

  const handleConfirmClick = async () => {
    if (loading || !onConfirm) return
    await onConfirm()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={loading ? undefined : onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
        />

        {/* Modal dialog card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          style={{ boxShadow: 'var(--shadow-modal)' }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white border-0 z-10"
        >
          {/* Close button */}
          {!loading && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="size-4" />
            </button>
          )}

          <div className="p-6">
            <div className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs dark:bg-slate-800">
                {getIcon()}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-6">
                  {title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            {/* Buttons action layout */}
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/60 pt-4">
              {!loading && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 text-xs font-bold bg-[#F3F4F6] text-[#374151] hover:bg-slate-200 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  {cancelText}
                </button>
              )}

              <button
                type="button"
                onClick={handleConfirmClick}
                disabled={loading}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs flex items-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  variant === "danger"
                    ? "bg-[#EF4444] hover:bg-rose-600"
                    : "bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)]"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>{loadingText}</span>
                  </>
                ) : (
                  <span>{confirmText}</span>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
