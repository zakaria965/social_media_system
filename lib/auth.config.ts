import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const googleClientId =
  process.env.GOOGLE_CLIENT_ID ??
  process.env.GOOGLE_ID ??
  process.env.AUTH_GOOGLE_ID ??
  ""

const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET ??
  process.env.GOOGLE_SECRET ??
  process.env.AUTH_GOOGLE_SECRET ??
  ""

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      try {
        if (new URL(url).origin === baseUrl) return url
      } catch {
        /* ignore */
      }
      return baseUrl
    },
  },
}
