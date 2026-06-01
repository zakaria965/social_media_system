"use client"

import * as React from "react"
import Link from "next/link"
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
import { cn } from "@/lib/utils"

type FieldErrors = Partial<
  Record<"firstName" | "lastName" | "email" | "subject" | "message" | "privacy", boolean>
>

export function ContactForm() {
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [subject, setSubject] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [privacy, setPrivacy] = React.useState(false)
  const [errors, setErrors] = React.useState<FieldErrors>({})
  const [success, setSuccess] = React.useState(false)

  function handleSubmit() {
    const next: FieldErrors = {}
    if (!firstName.trim()) next.firstName = true
    if (!lastName.trim()) next.lastName = true
    if (!email.trim()) next.email = true
    if (!subject.trim()) next.subject = true
    if (!message.trim()) next.message = true
    if (!privacy) next.privacy = true
    setErrors(next)
    if (Object.keys(next).length > 0) {
      setSuccess(false)
      return
    }
    setSuccess(true)
    setFirstName("")
    setLastName("")
    setEmail("")
    setPhone("")
    setSubject("")
    setMessage("")
    setPrivacy(false)
    setErrors({})
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Send us a message</CardTitle>
      </CardHeader>
      <CardContent>
        {success ? (
          <Alert className="border-primary/20 bg-green-50">
            <AlertTitle className="text-primary">Message sent!</AlertTitle>
            <AlertDescription className="text-primary">
              We&apos;ll get back to you within 24 hours.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                className={cn("mt-2", errors.firstName && "border-destructive")}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                aria-invalid={errors.firstName}
              />
              {errors.firstName ? (
                <p className="mt-1 text-xs text-destructive">Required</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                className={cn("mt-2", errors.lastName && "border-destructive")}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                aria-invalid={errors.lastName}
              />
              {errors.lastName ? (
                <p className="mt-1 text-xs text-destructive">Required</p>
              ) : null}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              className={cn("mt-2", errors.email && "border-destructive")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={errors.email}
            />
            {errors.email ? <p className="mt-1 text-xs text-destructive">Required</p> : null}
          </div>

          <div>
            <Label htmlFor="phone">
              Phone <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input id="phone" className="mt-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div>
            <Label>Subject</Label>
            <Select value={subject || undefined} onValueChange={setSubject}>
              <SelectTrigger
                className={cn("mt-2 w-full", errors.subject && "border-destructive")}
                aria-invalid={errors.subject}
                size="default"
              >
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Inquiry</SelectItem>
                <SelectItem value="support">Technical Support</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="bug">Bug Report</SelectItem>
              </SelectContent>
            </Select>
            {errors.subject ? <p className="mt-1 text-xs text-destructive">Required</p> : null}
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              rows={4}
              className={cn("mt-2", errors.message && "border-destructive")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              aria-invalid={errors.message}
            />
            {errors.message ? (
              <p className="mt-1 text-xs text-destructive">Required</p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="privacy"
              checked={privacy}
              onCheckedChange={(v) => setPrivacy(v === true)}
              aria-invalid={errors.privacy}
            />
            <Label htmlFor="privacy" className="text-sm font-normal">
              I agree to the{" "}
              <Link href="#" className="text-primary underline">
                Privacy Policy
              </Link>
            </Label>
          </div>
          {errors.privacy ? (
            <p className="-mt-3 text-xs text-destructive">Required</p>
          ) : null}

          <Button type="button" className="w-full" onClick={handleSubmit}>
            Send message
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
