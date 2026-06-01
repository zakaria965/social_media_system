import Image from "next/image"
import { Phone } from "lucide-react"
import {
  IconFacebook,
  IconInstagram,
  IconLinkedin,
  IconX,
} from "@/components/social-brand-icons"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { FadeInUp } from "@/components/fade-in-up"

const channels = [
  {
    name: "Facebook",
    handle: "@yourbrand",
    description:
      "Reach your audience on the world's largest social network. Schedule posts, manage pages, and track engagement.",
    bg: "bg-[#1877F2]",
    icon: IconFacebook,
    seed: "facebook",
  },
  {
    name: "Instagram",
    handle: "@yourbrand",
    description:
      "Share photos, stories, and reels. Plan your Instagram grid visually and auto-publish content.",
    bg: "bg-gradient-to-br from-[#E4405F] to-[#833AB4]",
    icon: IconInstagram,
    seed: "instagram",
  },
  {
    name: "Twitter / X",
    handle: "@yourbrand",
    description:
      "Share updates, threads, and engage in conversations. Schedule tweets and track mentions in real-time.",
    bg: "bg-[#000000]",
    icon: IconX,
    seed: "twitter",
  },
  {
    name: "LinkedIn",
    handle: "@yourbrand",
    description:
      "Build your professional brand. Schedule posts, track engagement, and grow your network authentically.",
    bg: "bg-[#0A66C2]",
    icon: IconLinkedin,
    seed: "linkedin",
  },
  {
    name: "WhatsApp",
    handle: "@yourbrand",
    description:
      "Connect with your audience directly. Share updates via WhatsApp Business and manage conversations.",
    bg: "bg-[#25D366]",
    icon: Phone,
    seed: "whatsapp",
  },
] as const

export default function ChannelsPage() {
  return (
    <>
      <Navbar />
      <main className="px-4 pb-24 md:px-6">
        <header className="mx-auto max-w-3xl pt-32 text-center">
          <h1 className="font-display text-5xl text-foreground">Channels</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Connect all your social accounts in one place
          </p>
        </header>

        <div className="mx-auto mt-16 flex max-w-4xl flex-col gap-6 py-16">
          {channels.map((c) => {
            const Icon = c.icon
            return (
              <FadeInUp key={c.name}>
                <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:gap-6">
                  <div
                    className={`flex size-14 shrink-0 items-center justify-center rounded-2xl text-white ${c.bg}`}
                  >
                    <Icon className="size-7" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-medium text-foreground">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.handle}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0 self-start md:self-center">
                    Connect
                  </Button>
                  <div className="hidden shrink-0 md:block">
                    <Image
                      src={`https://picsum.photos/seed/${c.seed}/128/80`}
                      alt=""
                      width={128}
                      height={80}
                      className="h-20 w-32 rounded-xl bg-muted object-cover"
                    />
                  </div>
                </div>
              </FadeInUp>
            )
          })}
        </div>
      </main>
      <Footer />
    </>
  )
}
