import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth.config"

const handler = NextAuth(authOptions)

export async function GET(
  req: any,
  { params }: { params: Promise<{ nextauth: string[] }> }
) {
  const resolvedParams = await params
  return handler(req, { params: resolvedParams })
}

export async function POST(
  req: any,
  { params }: { params: Promise<{ nextauth: string[] }> }
) {
  const resolvedParams = await params
  return handler(req, { params: resolvedParams })
}

