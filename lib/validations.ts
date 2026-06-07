import { z } from "zod"

export const passwordField = z
  .string({ message: "Password is required" })
  .min(8, "Use at least 8 characters")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[0-9]/, "Include at least one number")
  .regex(/[^A-Za-z0-9]/, "Include at least one special character")

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .min(2, "Name should be at least 2 characters")
    .max(80, "Name is too long"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: passwordField,
})

export type RegisterInput = z.infer<typeof registerSchema>

export const contactFieldSchemas = {
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  subject: z.string().min(1, "Required"),
  message: z.string().min(1, "Required"),
}
