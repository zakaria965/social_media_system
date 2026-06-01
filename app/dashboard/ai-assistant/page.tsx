"use client"

import { useCallback, useState } from "react"
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  Lightbulb,
  Hash,
  Shuffle,
  PenLine,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PageTransition } from "@/components/dashboard/page-transition"
import { useToast } from "@/components/toast-provider"
import { cn } from "@/lib/utils"

const tones = [
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual" },
  { id: "funny", label: "Funny" },
  { id: "marketing", label: "Marketing" },
  { id: "motivational", label: "Motivational" },
]

const initialHashtagSuggestions = [
  "#socialmedia", "#marketing", "#growth", "#digitalmarketing",
  "#contentcreator", "#branding", "#entrepreneur", "#business",
  "#startup", "#innovation", "#tech", "#future",
]

const contentIdeas = [
  "Share a behind-the-scenes look at your creative process",
  "Post a customer success story or testimonial",
  "Create a 'day in the life' content series",
  "Share industry insights and predictions",
  "Host an AMA (Ask Me Anything) session",
]

export default function AIAssistantPage() {
  const { showToast } = useToast()
  const [prompt, setPrompt] = useState("")
  const [generating, setGenerating] = useState(false)
  const [selectedTone, setSelectedTone] = useState("professional")
  const [result, setResult] = useState("")
  const [copied, setCopied] = useState(false)
  const [hashtags, setHashtags] = useState(initialHashtagSuggestions)
  const [ideas, setIdeas] = useState(contentIdeas)
  const [searchQuery, setSearchQuery] = useState("")

  const callAI = useCallback(async (
    action: string,
    promptText: string,
    tone?: string
  ) => {
    setGenerating(true)
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          prompt: promptText,
          tone,
          provider: "openai",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to generate")
      return data.result as string
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Generation failed"
      showToast(message, "error")
      return null
    } finally {
      setGenerating(false)
    }
  }, [showToast])

  const handleGenerate = async () => {
    if (!prompt) return
    const res = await callAI("generate-caption", prompt, selectedTone)
    if (res) setResult(res)
  }

  const handleRewrite = async () => {
    if (!result && !prompt) return
    const text = result || prompt
    const res = await callAI("rewrite-text", text, selectedTone)
    if (res) setResult(res)
  }

  const handleChangeTone = async () => {
    if (!result && !prompt) return
    const text = result || prompt
    const res = await callAI("change-tone", text, selectedTone)
    if (res) setResult(res)
  }

  const handleImproveGrammar = async () => {
    if (!result && !prompt) return
    const text = result || prompt
    const res = await callAI("improve-grammar", text)
    if (res) setResult(res)
  }

  const handleGenerateHashtags = async () => {
    const text = result || prompt
    if (!text) {
      showToast("Enter some content first", "info")
      return
    }
    const res = await callAI("generate-hashtags", text)
    if (res) {
      const tags = res
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.startsWith("#"))
      if (tags.length > 0) setHashtags(tags.slice(0, 15))
    }
  }

  const handleContentIdeas = async () => {
    const text = prompt || "social media content"
    const res = await callAI("content-ideas", text)
    if (res) {
      const lines = res
        .split("\n")
        .map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim())
        .filter((l) => l.length > 10)
      if (lines.length > 0) setIdeas(lines.slice(0, 5))
    }
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    showToast("Copied to clipboard", "success")
  }

  const filteredHashtags = hashtags.filter((h) =>
    h.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">AI Content Assistant</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate captions, hashtags, and content ideas with AI.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-xl border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                AI Caption Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Describe what you want to post about..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-24 resize-y rounded-xl border-border/60 bg-muted/30"
              />

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Writing Style</p>
                <div className="flex flex-wrap gap-2">
                  {tones.map((tone) => (
                    <Badge
                      key={tone.id}
                      variant={selectedTone === tone.id ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1"
                      onClick={() => setSelectedTone(tone.id)}
                    >
                      {tone.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating || !prompt}
                className="w-full rounded-xl"
              >
                {generating ? (
                  <><Loader2 className="size-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="size-4" /> Generate Caption</>
                )}
              </Button>

              {result && (
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Generated Caption</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => handleCopy(result)}>
                        {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={handleGenerate}>
                        <RefreshCw className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-foreground">{result}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="rounded-xl border-border/60">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Hash className="size-4 text-primary" />
                  Hashtag Suggestions
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleGenerateHashtags}
                  disabled={generating}
                >
                  <RefreshCw className={cn("size-3.5", generating && "animate-spin")} />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {filteredHashtags.map((h) => (
                    <Badge
                      key={h}
                      variant="secondary"
                      className="cursor-pointer text-xs hover:bg-primary/10 hover:text-primary"
                      onClick={() => {
                        navigator.clipboard.writeText(h)
                        showToast("Copied " + h, "success")
                      }}
                    >
                      {h}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3">
                  <Input
                    placeholder="Search hashtags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-lg border-border/60 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border/60">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Lightbulb className="size-4 text-primary" />
                  Content Ideas
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleContentIdeas}
                  disabled={generating}
                >
                  <RefreshCw className={cn("size-3.5", generating && "animate-spin")} />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {ideas.map((idea, i) => (
                  <div
                    key={i}
                    className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/50 p-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                    onClick={() => {
                      setPrompt(idea)
                      showToast("Idea added to prompt", "info")
                    }}
                  >
                    <ArrowRight className="mt-0.5 size-3 shrink-0 text-primary" />
                    <span>{idea}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="rounded-xl border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <PenLine className="size-4 text-primary" />
                Quick Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 rounded-lg"
                size="sm"
                onClick={handleRewrite}
                disabled={generating}
              >
                {generating ? <Loader2 className="size-3.5 animate-spin" /> : <Shuffle className="size-3.5" />}
                Rewrite Text
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 rounded-lg"
                size="sm"
                onClick={handleChangeTone}
                disabled={generating}
              >
                {generating ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                Change Tone
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 rounded-lg"
                size="sm"
                onClick={handleImproveGrammar}
                disabled={generating}
              >
                {generating ? <Loader2 className="size-3.5 animate-spin" /> : <PenLine className="size-3.5" />}
                Improve Grammar
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 rounded-lg"
                size="sm"
                onClick={handleGenerateHashtags}
                disabled={generating}
              >
                {generating ? <Loader2 className="size-3.5 animate-spin" /> : <Hash className="size-3.5" />}
                SEO Optimization
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/60">
            <CardHeader>
              <CardTitle className="text-sm">Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Generations today</span>
                <span className="font-medium text-foreground">12 / 50</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-1/4 rounded-full bg-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Resets in 14 hours</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
