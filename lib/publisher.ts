export type Publisher = (
  content: string,
  media: string[],
  accessToken: string,
  pageId?: string
) => Promise<any>

export function parseBase64(dataUrl: string): { type: string; buffer: Buffer } | null {
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
  if (!matches || matches.length !== 3) return null
  return {
    type: matches[1],
    buffer: Buffer.from(matches[2], "base64"),
  }
}

export async function publishToFacebook(
  content: string,
  media: string[],
  accessToken: string,
  pageId?: string
) {
  const pid = pageId || "me"
  if (media.length > 0) {
    const firstMedia = media[0]
    const parsed = parseBase64(firstMedia)
    const isVideo = parsed
      ? parsed.type.startsWith("video/")
      : firstMedia.includes("video") ||
        firstMedia.endsWith(".mp4") ||
        firstMedia.endsWith(".webm") ||
        firstMedia.endsWith(".mov")

    const formData = new FormData()
    formData.append("access_token", accessToken)

    if (isVideo) {
      formData.append("description", content)
      if (parsed) {
        const blob = new Blob([new Uint8Array(parsed.buffer)], { type: parsed.type })
        formData.append("source", blob, `video.${parsed.type.split("/")[1] || "mp4"}`)
      } else {
        formData.append("file_url", firstMedia)
      }
      const res = await fetch(`https://graph-video.facebook.com/v22.0/${pid}/videos`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error(`Facebook video publish failed: ${await res.text()}`)
      return res.json()
    } else {
      formData.append("message", content)
      if (parsed) {
        const blob = new Blob([new Uint8Array(parsed.buffer)], { type: parsed.type })
        formData.append("source", blob, `photo.${parsed.type.split("/")[1] || "jpg"}`)
      } else {
        formData.append("url", firstMedia)
      }
      const res = await fetch(`https://graph.facebook.com/v22.0/${pid}/photos`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error(`Facebook photo publish failed: ${await res.text()}`)
      return res.json()
    }
  }

  const res = await fetch(`https://graph.facebook.com/v22.0/${pid}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: content, access_token: accessToken }),
  })
  if (!res.ok) throw new Error(`Facebook publish failed: ${await res.text()}`)
  return res.json()
}

export async function publishToLinkedIn(content: string, media: string[], accessToken: string) {
  const body: Record<string, unknown> = {
    author: `urn:li:person:{userId}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: content },
        shareMediaCategory: media.length > 0 ? "IMAGE" : "NONE",
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  }
  if (media.length > 0) {
    const sc = body.specificContent as Record<string, unknown>
    const share = sc["com.linkedin.ugc.ShareContent"] as Record<string, unknown>
    share.media = [
      { status: "READY", description: { text: "" }, media: media[0], title: { text: "" } },
    ]
  }
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`LinkedIn publish failed: ${await res.text()}`)
  return res.json()
}

export async function publishToTwitter(content: string, _media: string[], accessToken: string) {
  const text = content.length > 280 ? content.slice(0, 277) + "..." : content
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(`Twitter publish failed: ${await res.text()}`)
  return res.json()
}

export async function publishToTikTok(content: string, media: string[], accessToken: string) {
  if (media.length === 0) {
    throw new Error("TikTok requires video media")
  }
  const res = await fetch("https://open-api.tiktok.com/video/publish/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: { title: content, privacy_level: "PUBLIC" },
      source_info: { source: "PULL_FROM_URL", video_url: media[0] },
    }),
  })
  if (!res.ok) throw new Error(`TikTok publish failed: ${await res.text()}`)
  return res.json()
}

export const publisherMap: Record<string, Publisher> = {
  facebook: publishToFacebook,
  linkedin: publishToLinkedIn,
  twitter: publishToTwitter,
  tiktok: publishToTikTok,
}
