export {}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          prompt: (
            momentListener?: (notification: {
              isNotDisplayed: () => boolean
              isSkippedMoment: () => boolean
              getNotDisplayedReason: () => string
            }) => void
          ) => void
        }
      }
    }
  }
}
