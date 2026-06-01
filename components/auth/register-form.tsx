"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react"
import { registerSchema, type RegisterInput } from "@/lib/validations"
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

function passwordChecks(password: string) {
  return {
    len: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    num: /[0-9]/.test(password),
    spec: /[^A-Za-z0-9]/.test(password),
  }
}

type Props = {
  defaultEmail?: string
}

export function RegisterForm({ defaultEmail = "" }: Props) {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [success, setSuccess] = React.useState(false)

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: defaultEmail, password: "" },
    mode: "onTouched",
  })

  const pwd = useWatch({ control: form.control, name: "password" }) ?? ""
  const checks = passwordChecks(pwd)

  React.useEffect(() => {
    if (defaultEmail) form.setValue("email", defaultEmail)
  }, [defaultEmail, form])

  async function onSubmit(data: RegisterInput) {
    setSuccess(false)
    await new Promise((r) => setTimeout(r, 500))
    setSuccess(true)
    form.reset({ fullName: "", email: "", password: "" })

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.ok) {
      router.push("/dashboard")
    }
  }

  return (
    <div>
      <GoogleSignInButton callbackUrl="/dashboard" label="Sign up with Google" />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or use email</span>
        </div>
      </div>

      {success ? (
        <Alert className="mb-6 rounded-xl border-primary/20 bg-primary/5">
          <AlertTitle className="text-primary">Account created!</AlertTitle>
          <AlertDescription className="text-primary/80">
            Redirecting to your dashboard...
          </AlertDescription>
        </Alert>
      ) : null}

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <Label htmlFor="reg-name" className="text-sm font-medium text-foreground">
            Full name
          </Label>
          <Input
            id="reg-name"
            autoComplete="name"
            placeholder="John Doe"
            className={cn(
              "h-11 rounded-xl border-border/70 bg-white/50 px-4 text-sm shadow-sm transition-all",
              "placeholder:text-muted-foreground/50",
              "focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/10",
              form.formState.errors.fullName && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/10"
            )}
            {...form.register("fullName")}
          />
          {form.formState.errors.fullName ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.fullName.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-email" className="text-sm font-medium text-foreground">
            Email address
          </Label>
          <Input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={cn(
              "h-11 rounded-xl border-border/70 bg-white/50 px-4 text-sm shadow-sm transition-all",
              "placeholder:text-muted-foreground/50",
              "focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/10",
              form.formState.errors.email && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/10"
            )}
            {...form.register("email")}
          />
          {form.formState.errors.email ? (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-password" className="text-sm font-medium text-foreground">
            Password
          </Label>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
              className={cn(
                "h-11 rounded-xl border-border/70 bg-white/50 px-4 pr-11 text-sm shadow-sm transition-all",
                "placeholder:text-muted-foreground/50",
                "focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/10",
                form.formState.errors.password && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/10"
              )}
              {...form.register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
          {pwd.length > 0 ? (
            <ul className="space-y-1 pt-1">
              <CheckRow ok={checks.len} text="At least 8 characters" />
              <CheckRow ok={checks.upper} text="One uppercase letter" />
              <CheckRow ok={checks.lower} text="One lowercase letter" />
              <CheckRow ok={checks.num} text="One number" />
              <CheckRow ok={checks.spec} text="One special character" />
            </ul>
          ) : null}
          {form.formState.errors.password ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-xl bg-primary shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30 active:scale-[0.98]"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Creating account…
            </span>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        By creating an account, you agree to our{" "}
        <Link href="#" className="underline hover:text-foreground">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
      </p>
    </div>
  )
}

function CheckRow({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className={cn("flex items-center gap-2 text-xs", ok ? "text-primary" : "text-muted-foreground")}>
      {ok ? (
        <Check className="size-3.5 shrink-0" />
      ) : (
        <X className="size-3.5 shrink-0 text-muted-foreground/50" />
      )}
      {text}
    </li>
  )
}
