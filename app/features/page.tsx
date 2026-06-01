import Link from "next/link"
import {
  BarChart3,
  Lightbulb,
  Link as LinkIcon,
  MessageCircle,
  Send,
  Sparkles,
  Users,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { FadeInUp } from "@/components/fade-in-up"

const features = [
  {
    id: "create",
    icon: Lightbulb,
    title: "Create",
    description:
      "Build your own library of content ideas. Draft posts, save templates, and organize your creative workflow in one place.",
  },
  {
    id: "publish",
    icon: Send,
    title: "Publish",
    description:
      "Plan and schedule your content across social media platforms. Set it and forget it — your posts go live at the perfect time.",
  },
  {
    id: "analyze",
    icon: BarChart3,
    title: "Analyze",
    description:
      "Measure performance and turn insights into growth. Track engagement, reach, and follower growth with beautiful reports.",
  },
  {
    id: "community",
    icon: MessageCircle,
    title: "Community",
    description:
      "Easily engage with your community. Respond to comments, messages, and mentions from a unified inbox.",
  },
  {
    id: "collaborate",
    icon: Users,
    title: "Collaborate",
    description:
      "Work together seamlessly, from planning to publishing. Assign tasks, review drafts, and approve content as a team.",
  },
  {
    id: "start-page",
    icon: LinkIcon,
    title: "Start Page",
    description:
      "Build a custom link-in-bio page in minutes. Showcase your best links, products, and content in one beautiful page.",
  },
  {
    id: "ai",
    icon: Sparkles,
    title: "AI Assistant",
    description:
      "Get help creating, refining, and repurposing content. Let AI generate captions, hashtags, and post ideas instantly.",
  },
] as const

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main className="px-4 pb-24 md:px-6">
        <header className="mx-auto max-w-3xl pt-32 text-center">
          <h1 className="font-display text-5xl text-foreground">Features</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            All the tools you need to manage your social media like a pro
          </p>
        </header>

        <div className="mx-auto mt-16 grid max-w-6xl gap-8 py-16 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, idx) => {
            const Icon = f.icon
            const spanLast = idx === features.length - 1
            return (
              <FadeInUp
                key={f.title}
                className={spanLast ? "md:col-span-2 lg:col-span-3 lg:mx-auto lg:max-w-lg" : ""}
              >
                <div
                  id={f.id}
                  className="h-full scroll-mt-28 rounded-2xl border border-border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-green-100">
                    <Icon className="size-6 text-primary" aria-hidden />
                  </div>
                  <h2 className="mt-4 text-xl font-medium text-foreground">{f.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              </FadeInUp>
            )
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Ready to try it?{" "}
          <Link href="/login" className="font-medium text-primary">
            Get started for free
          </Link>
        </p>
      </main>
      <Footer />
    </>
  )
}
