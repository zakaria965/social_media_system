import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { syncManager } from "@/lib/sync"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 })
  }

  const email = session.user.email.toLowerCase().trim()
  const encoder = new TextEncoder()

  const responseStream = new ReadableStream({
    start(controller) {
      // Callback to push data into stream
      const onMessage = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (e) {
          console.error("Stream controller enqueue error for email:", email, e)
        }
      }

      // Subscribe user to real-time events
      syncManager.on(`member:${email}`, onMessage)

      // Send initial successful connection handshake event
      try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: "connected" })}\n\n`))
      } catch (e) {
        console.error("Failed to send initial SSE connection chunk:", e)
      }

      // Broadcast periodic empty heartbeat pings to prevent browser/proxy timeouts (every 15s)
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`))
        } catch (e) {
          // Stream might have closed
          clearInterval(pingInterval)
        }
      }, 15000)

      // Unsubscribe and clean up on request close
      request.signal.addEventListener("abort", () => {
        clearInterval(pingInterval)
        syncManager.off(`member:${email}`, onMessage)
      })
    }
  })

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    }
  })
}
