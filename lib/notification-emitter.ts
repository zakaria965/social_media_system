import { EventEmitter } from "events"

class NotificationEmitter extends EventEmitter {}

// Ensure single instance across hot-reloads in development
const globalEmitter = global as any
if (!globalEmitter.notificationEmitter) {
  globalEmitter.notificationEmitter = new NotificationEmitter()
}

export const notificationEmitter: NotificationEmitter = globalEmitter.notificationEmitter
