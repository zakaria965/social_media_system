"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { loginSchema, type LoginInput } from "@/lib/validations"
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [authError, setAuthError] = React.useState("")

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  })

  async function onSubmit(data: LoginInput) {
    setAuthError("")
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      setAuthError("Invalid email or password. Please try again.")
      return
    }

    if (result?.ok) {
      router.push("/dashboard")
    }
  }

  return (
    <div>
      <GoogleSignInButton callbackUrl="/dashboard" />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or continue with email</span>
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-sm font-medium text-foreground">
            Email address
          </Label>
          <Input
            id="login-email"
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
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
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
              Signing in…
            </span>
          ) : (
            "Sign in"
          )}
        </Button>

        {authError ? (
          <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-center text-sm text-destructive">
            {authError}
          </p>
        ) : null}
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
        <span className="mx-1.5 text-muted-foreground/40">·</span>
        <Link href="/register" className="font-medium text-primary hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}
