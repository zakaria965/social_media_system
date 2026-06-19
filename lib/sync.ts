import { EventEmitter } from "events"

class SyncManager extends EventEmitter {
  private static instance: SyncManager

  private constructor() {
    super()
    // Set a high maximum listener limit to support many concurrent user tabs
    this.setMaxListeners(500)
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  /**
   * Broadcast a team update message to all active stream sessions of a user.
   */
  public broadcastMemberUpdate(email: string, eventName: string, data: any) {
    const normalizedEmail = email.toLowerCase().trim()
    this.emit(`member:${normalizedEmail}`, { event: eventName, ...data })
  }
}

export const syncManager = SyncManager.getInstance()
