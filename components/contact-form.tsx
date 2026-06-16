"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

type FieldErrors = Partial<
  Record<"firstName" | "lastName" | "email" | "subject" | "message" | "privacy", boolean>
>

export function ContactForm() {
  const router = useRouter()
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [subject, setSubject] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [privacy, setPrivacy] = React.useState(false)
  const [errors, setErrors] = React.useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const next: FieldErrors = {}
    if (!firstName.trim()) next.firstName = true
    if (!lastName.trim()) next.lastName = true
    if (!email.trim()) next.email = true
    if (!subject.trim()) next.subject = true
    if (!message.trim()) next.message = true
    if (!privacy) next.privacy = true
    
    setErrors(next)
    if (Object.keys(next).length > 0) {
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
          firstName,
          lastName,
          email,
          phone,
          subject,
          message,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.")
      }

      // Clear form on success
      setFirstName("")
      setLastName("")
      setEmail("")
      setPhone("")
      setSubject("")
      setMessage("")
      setPrivacy(false)
      setErrors({})
      
      // Trigger modal
      setShowSuccessModal(true)
    } catch (err: any) {
      console.error(err)
      setSubmitError(err.message || "Failed to submit. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card className="border-0 bg-white shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] rounded-[16px]">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight text-[#111827]">
            Send us a message
          </CardTitle>
          <p className="text-sm text-[#64748B] mt-1">
            Fill out the form below and we will get back to you as soon as possible.
          </p>
        </CardHeader>
        <CardContent>
          {submitError && (
            <Alert variant="destructive" className="mb-6 rounded-xl">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-semibold text-[#111827]">First name</Label>
                <Input
                  id="firstName"
                  placeholder="Jane"
                  className={cn(
                    "rounded-xl border-[#EEF2F7] focus:border-[#30FC47] focus:ring-1 focus:ring-[#30FC47] h-10 transition-colors bg-white", 
                    errors.firstName && "border-destructive focus:ring-destructive"
                  )}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  aria-invalid={errors.firstName}
                  disabled={isSubmitting}
                />
                {errors.firstName && (
                  <p className="text-[10px] font-medium text-destructive">First name is required</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-semibold text-[#111827]">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  className={cn(
                    "rounded-xl border-[#EEF2F7] focus:border-[#30FC47] focus:ring-1 focus:ring-[#30FC47] h-10 transition-colors bg-white",
                    errors.lastName && "border-destructive focus:ring-destructive"
                  )}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  aria-invalid={errors.lastName}
                  disabled={isSubmitting}
                />
                {errors.lastName && (
                  <p className="text-[10px] font-medium text-destructive">Last name is required</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-[#111827]">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane.doe@example.com"
                className={cn(
                  "rounded-xl border-[#EEF2F7] focus:border-[#30FC47] focus:ring-1 focus:ring-[#30FC47] h-10 transition-colors bg-white",
                  errors.email && "border-destructive focus:ring-destructive"
                )}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={errors.email}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-[10px] font-medium text-destructive">Email is required</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold text-[#111827]">
                Phone number <span className="text-[#9CA3AF] font-normal">(Optional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+252 63 XXXXXXX"
                className="rounded-xl border-[#EEF2F7] focus:border-[#30FC47] focus:ring-1 focus:ring-[#30FC47] h-10 transition-colors bg-white"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#111827]">Subject</Label>
              <Select value={subject || undefined} onValueChange={setSubject} disabled={isSubmitting}>
                <SelectTrigger
                  className={cn(
                    "rounded-xl border-[#EEF2F7] focus:border-[#30FC47] focus:ring-1 focus:ring-[#30FC47] h-10 transition-colors bg-white w-full",
                    errors.subject && "border-destructive focus:ring-destructive"
                  )}
                  aria-invalid={errors.subject}
                >
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#EEF2F7]">
                  <SelectItem value="support">Technical Support</SelectItem>
                  <SelectItem value="sales">Sales & Upgrades</SelectItem>
                  <SelectItem value="partnership">Business Partnerships</SelectItem>
                  <SelectItem value="feedback">Product Feedback</SelectItem>
                  <SelectItem value="general">General Inquiry</SelectItem>
                </SelectContent>
              </Select>
              {errors.subject && (
                <p className="text-[10px] font-medium text-destructive">Please select a subject</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message" className="text-xs font-semibold text-[#111827]">Message</Label>
              <Textarea
                id="message"
                placeholder="How can we help you grow?"
                rows={4}
                className={cn(
                  "rounded-xl border-[#EEF2F7] focus:border-[#30FC47] focus:ring-1 focus:ring-[#30FC47] transition-colors bg-white resize-none",
                  errors.message && "border-destructive focus:ring-destructive"
                )}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                aria-invalid={errors.message}
                disabled={isSubmitting}
              />
              {errors.message && (
                <p className="text-[10px] font-medium text-destructive">Message content is required</p>
              )}
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="privacy"
                  checked={privacy}
                  onCheckedChange={(v) => setPrivacy(v === true)}
                  aria-invalid={errors.privacy}
                  disabled={isSubmitting}
                  className="mt-0.5 rounded-md border-[#EEF2F7] data-[state=checked]:bg-[#30FC47] data-[state=checked]:border-[#30FC47] data-[state=checked]:text-black"
                />
                <Label htmlFor="privacy" className="text-xs text-[#64748B] leading-snug font-normal select-none">
                  I agree to the{" "}
                  <Link href="#" className="text-[#111827] font-semibold underline decoration-[#30FC47]/60 underline-offset-2 hover:decoration-[#30FC47]">
                    Privacy Policy
                  </Link>{" "}
                  and consent to having my information processed.
                </Label>
              </div>
              {errors.privacy && (
                <p className="text-[10px] font-medium text-destructive">You must agree to the Privacy Policy</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 mt-4 rounded-xl font-semibold bg-[#30FC47] hover:bg-[#30FC47]/90 text-black shadow-[0_4px_12px_rgba(48,252,71,0.25)] border-0 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin text-black" />
                  Sending Message...
                </>
              ) : (
                <>
                  Send Message
                  <ArrowRight className="size-4 text-black" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowSuccessModal(false)
                router.push("/")
              }}
              className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.45 }}
              className="relative w-full max-w-md overflow-hidden rounded-[24px] bg-white p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-10 border border-[#EEF2F7]"
            >
              {/* Decorative background glow */}
              <div className="absolute -top-20 -left-20 size-40 rounded-full bg-[#30FC47]/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 size-40 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#30FC47]/10 border border-[#30FC47]/20 mb-6">
                <CheckCircle2 className="size-8 text-emerald-500" />
              </div>

              <h3 className="text-2xl font-bold tracking-tight text-[#111827]">
                Message Sent Successfully
              </h3>
              
              <p className="mt-3 text-sm leading-relaxed text-[#64748B]">
                Thank you for contacting GrowWave. Our team will review your message and respond as soon as possible.
              </p>

              <button
                onClick={() => {
                  setShowSuccessModal(false)
                  router.push("/")
                }}
                className="mt-8 w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                Return Home
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
