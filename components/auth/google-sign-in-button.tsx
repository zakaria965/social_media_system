"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GoogleLogoSVG } from "@/components/google-logo-svg"

type Props = {
  callbackUrl?: string
  label?: string
}

export function GoogleSignInButton({
  callbackUrl = "/dashboard",
  label = "Continue with Google",
}: Props) {
  const [pending, setPending] = React.useState(false)

  return (
    <Button
      type="button"
      variant="outline"
      className="flex h-11 w-full items-center gap-3 rounded-xl border-border/70 bg-white shadow-sm transition-all hover:bg-muted/50 hover:shadow-md active:scale-[0.98]"
      disabled={pending}
      onClick={() => {
        setPending(true)
        void signIn("google", { callbackUrl })
      }}
    >
      {pending ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <GoogleLogoSVG />
      )}
      <span className="text-sm font-medium">{pending ? "Redirecting…" : label}</span>
    </Button>
  )
}
