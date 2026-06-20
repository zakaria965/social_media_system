import { NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth.config"
import { notificationEmitter } from "@/lib/notification-emitter"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 })
  }

  const email = session.user.email.toLowerCase()

  const responseStream = new TransformStream()
  const writer = responseStream.writable.getWriter()
  const encoder = new TextEncoder()

  // Helper function to send formatted event stream data
  const sendEvent = (data: any) => {
    try {
      writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
    } catch (err) {
      console.error("SSE write error:", err)
    }
  }

  // Establish connection with a ping event
  sendEvent({ type: "ping" })

  // Listen for new notifications
  const onNotification = (data: { userId: string; notification: any }) => {
    if (data.userId === email) {
      sendEvent({ type: "notification", notification: data.notification })
    }
  }

  notificationEmitter.on("new-notification", onNotification)

  // Keep the SSE connection alive with periodic pings every 25 seconds
  const pingInterval = setInterval(() => {
    try {
      sendEvent({ type: "ping" })
    } catch {
      cleanup()
    }
  }, 25000)

  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    clearInterval(pingInterval)
    notificationEmitter.off("new-notification", onNotification)
    try {
      writer.close()
    } catch {}
  }

  // Clean up if the client disconnects or aborts the request
  request.signal.addEventListener("abort", () => {
    cleanup()
  })

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  })
}
