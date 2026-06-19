import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      plan?: "FREE" | "PRO" | "AGENCY"
      subscriptionStatus?: "ACTIVE" | "CANCELLED" | "EXPIRED"
      role?: "USER" | "ADMIN"
      status?: "ACTIVE" | "SUSPENDED"
      /** True if the user belongs to at least one workspace (own or invited) */
      hasWorkspaceMembership?: boolean
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    plan?: "FREE" | "PRO" | "AGENCY"
    subscriptionStatus?: "ACTIVE" | "CANCELLED" | "EXPIRED"
    role?: "USER" | "ADMIN"
    status?: "ACTIVE" | "SUSPENDED"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    plan?: "FREE" | "PRO" | "AGENCY"
    subscriptionStatus?: "ACTIVE" | "CANCELLED" | "EXPIRED"
    role?: "USER" | "ADMIN"
    status?: "ACTIVE" | "SUSPENDED"
    /** True if the user belongs to at least one workspace (own or invited) */
    hasWorkspaceMembership?: boolean
  }
}
