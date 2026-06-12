import mongoose from "mongoose"
import { initScheduler } from "./scheduler"

if (!process.env.GEMINI_API_KEY) {
  try {
    const dotenv = require("dotenv")
    dotenv.config()
  } catch (err) {
    console.warn("Failed to load dotenv package dynamically", err)
  }
}

const MONGODB_URL = process.env.MONGODB_URL

if (!MONGODB_URL) {
  throw new Error("Please define the MONGODB_URL environment variable")
}

const cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } = (
  (global as unknown as { _mongooseCache?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } })._mongooseCache ??= { conn: null, promise: null }
)

export async function connectDB() {
  if (cached.conn) return cached.conn

  cached.promise ??= mongoose.connect(MONGODB_URL!, {
    bufferCommands: false,
  })

  cached.conn = await cached.promise

  // Boot the automatic publishing engine inside Node server process
  if (typeof window === "undefined") {
    initScheduler()
  }

  return cached.conn
}
