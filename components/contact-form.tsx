"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check, Loader2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ContactFormProps {
  subject?: string
  setSubject?: (subject: string) => void
  nameInputRef?: React.RefObject<HTMLInputElement | null>
}

export function ContactForm({ subject: propSubject, setSubject: propSetSubject, nameInputRef }: ContactFormProps) {
  const router = useRouter()
  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [localSubject, setLocalSubject] = React.useState("")
  const [message, setMessage] = React.useState("")
  
  // Support both controlled (by page) and local state for subject
  const subject = propSubject !== undefined ? propSubject : localSubject
  const setSubject = propSetSubject !== undefined ? propSetSubject : setLocalSubject

  const [errors, setErrors] = React.useState<{ fullName?: boolean; email?: boolean; subject?: boolean; message?: boolean }>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [isSuccess, setIsSuccess] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const nextErrors: typeof errors = {}
    if (!fullName.trim()) nextErrors.fullName = true
    if (!email.trim() || !email.includes("@")) nextErrors.email = true
    if (!subject.trim()) nextErrors.subject = true
    if (!message.trim()) nextErrors.message = true
    
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          subject,
          message,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.")
      }

      // Clear form on success
      setFullName("")
      setEmail("")
      setSubject("")
      setMessage("")
      setErrors({})
      
      // Trigger success state
      setIsSuccess(true)
    } catch (err: any) {
      console.error(err)
      setSubmitError(err.message || "Failed to submit. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-8 md:p-10 rounded-[24px] border border-[#E5E7EB] shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
          >
            {/* Form Header */}
            <div className="mb-8">
              <h3 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                Send Us A Message
              </h3>
              <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
                Fill out the form below and our team will get back to you shortly.
              </p>
            </div>

            {submitError && (
              <Alert variant="destructive" className="mb-6 rounded-xl border-red-200 bg-red-50 text-red-800">
                <AlertTitle className="font-bold">Submission Error</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-semibold text-[#0F172A]">
                  Full Name
                </Label>
                <Input
                  ref={nameInputRef}
                  id="fullName"
                  placeholder="John Doe"
                  className={cn(
                    "rounded-[12px] border-[#E5E7EB] focus:border-[#22C55E] focus:ring-[#22C55E]/15 h-[48px] transition-all bg-[#FFFFFF] text-sm px-4 outline-none focus-visible:ring-4 focus-visible:ring-offset-0 focus-visible:border-[#22C55E] text-[#0F172A]", 
                    errors.fullName && "border-red-300 focus-visible:ring-red-100 focus-visible:border-red-400"
                  )}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSubmitting}
                />
                {errors.fullName && (
                  <p className="text-[10px] font-medium text-red-500">Please enter your full name</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-[#0F172A]">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className={cn(
                    "rounded-[12px] border-[#E5E7EB] focus:border-[#22C55E] focus:ring-[#22C55E]/15 h-[48px] transition-all bg-[#FFFFFF] text-sm px-4 outline-none focus-visible:ring-4 focus-visible:ring-offset-0 focus-visible:border-[#22C55E] text-[#0F172A]",
                    errors.email && "border-red-300 focus-visible:ring-red-100 focus-visible:border-red-400"
                  )}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-[10px] font-medium text-red-500">Please enter a valid email address</p>
                )}
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs font-semibold text-[#0F172A]">
                  Subject
                </Label>
                <Input
                  id="subject"
                  placeholder="Partnership Inquiry, Support request..."
                  className={cn(
                    "rounded-[12px] border-[#E5E7EB] focus:border-[#22C55E] focus:ring-[#22C55E]/15 h-[48px] transition-all bg-[#FFFFFF] text-sm px-4 outline-none focus-visible:ring-4 focus-visible:ring-offset-0 focus-visible:border-[#22C55E] text-[#0F172A]",
                    errors.subject && "border-red-300 focus-visible:ring-red-100 focus-visible:border-red-400"
                  )}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isSubmitting}
                />
                {errors.subject && (
                  <p className="text-[10px] font-medium text-red-500">Please enter a subject</p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs font-semibold text-[#0F172A]">
                  Message
                </Label>
                <Textarea
                  id="message"
                  placeholder="How can we help you?"
                  rows={4}
                  className={cn(
                    "rounded-[12px] border-[#E5E7EB] focus:border-[#22C55E] focus:ring-[#22C55E]/15 h-[140px] transition-all bg-[#FFFFFF] text-sm px-4 py-3 resize-none outline-none focus-visible:ring-4 focus-visible:ring-offset-0 focus-visible:border-[#22C55E] text-[#0F172A]",
                    errors.message && "border-red-300 focus-visible:ring-red-100 focus-visible:border-red-400"
                  )}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isSubmitting}
                />
                {errors.message && (
                  <p className="text-[10px] font-medium text-red-500">Please enter your message details</p>
                )}
              </div>

              {/* Submit Button: Solid brand green background (#22C55E), White text, hover slightly darker (#16A34A) */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-[56px] rounded-[14px] font-semibold bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-[0_4px_12px_rgba(34,197,94,0.15)] hover:shadow-[0_8px_24px_rgba(34,197,94,0.25)] border-0 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2 text-base font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin text-white" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white p-10 md:p-12 rounded-[24px] border border-[#E5E7EB] shadow-[0_20px_60px_rgba(15,23,42,0.08)] text-center flex flex-col items-center relative overflow-hidden"
          >
            {/* Soft decorative background glows */}
            <div className="absolute -top-24 -left-24 size-48 rounded-full bg-[#22C55E]/5 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 size-48 rounded-full bg-[#22C55E]/10 blur-3xl pointer-events-none" />

            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 mb-6 shadow-inner">
              <Check className="size-6 text-[#22C55E] stroke-[3px]" />
            </div>

            <h3 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
              ✓ Message Sent
            </h3>
            
            <p className="mt-4 text-sm leading-relaxed text-[#64748B] max-w-sm">
              Thank you for contacting GrowWave. <br /> Our team will reply within 24 hours.
            </p>

            <button
              onClick={() => {
                router.push("/")
              }}
              className="mt-8 w-full max-w-xs h-[48px] rounded-[12px] bg-[#0F172A] hover:bg-[#0F172A]/90 text-white font-semibold shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              Return Home
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
