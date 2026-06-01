"use client"

import { type LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  change: string
  trend: "up" | "down" | "neutral"
  icon: LucideIcon
  sparkline?: number[]
}

export function StatsCard({ title, value, change, trend, icon: Icon, sparkline }: StatsCardProps) {
  const hasSparkline = sparkline && sparkline.length > 1
  let svgPath = ""
  let fillPath = ""
  const width = 120
  const height = 30
  
  if (hasSparkline) {
    const maxVal = Math.max(...sparkline) || 1
    const minVal = Math.min(...sparkline) || 0
    const range = maxVal - minVal || 1
    const padding = 2
    
    const points = sparkline.map((val, index) => {
      const x = (index / (sparkline.length - 1)) * width
      const y = height - padding - ((val - minVal) / range) * (height - 2 * padding)
      return { x, y }
    })
    
    svgPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    fillPath = `${svgPath} L ${width} ${height} L 0 ${height} Z`
  }

  // Assign rich gradients, borders, and styles based on metric title
  const getThemeStyles = (t: string) => {
    const normalized = t.toLowerCase()
    if (normalized.includes("published")) {
      return {
        bg: "from-indigo-600/5 to-violet-600/5 hover:border-indigo-500/30",
        iconBg: "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400",
        stroke: "#6366f1",
        fill: "rgba(99, 102, 241, 0.05)",
      }
    }
    if (normalized.includes("scheduled")) {
      return {
        bg: "from-blue-600/5 to-cyan-600/5 hover:border-blue-500/30",
        iconBg: "bg-blue-500/10 text-blue-500 dark:text-blue-400",
        stroke: "#3b82f6",
        fill: "rgba(59, 130, 246, 0.05)",
      }
    }
    if (normalized.includes("reach")) {
      return {
        bg: "from-amber-600/5 to-orange-600/5 hover:border-amber-500/30",
        iconBg: "bg-amber-500/10 text-amber-500 dark:text-amber-400",
        stroke: "#f59e0b",
        fill: "rgba(245, 158, 11, 0.05)",
      }
    }
    if (normalized.includes("engagement")) {
      return {
        bg: "from-emerald-600/5 to-teal-600/5 hover:border-emerald-500/30",
        iconBg: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
        stroke: "#10b981",
        fill: "rgba(16, 185, 129, 0.05)",
      }
    }
    if (normalized.includes("followers") || normalized.includes("growth")) {
      return {
        bg: "from-violet-600/5 to-fuchsia-600/5 hover:border-violet-500/30",
        iconBg: "bg-violet-500/10 text-violet-500 dark:text-violet-400",
        stroke: "#8b5cf6",
        fill: "rgba(139, 92, 246, 0.05)",
      }
    }
    // Default or AI generated
    return {
      bg: "from-pink-600/5 to-rose-600/5 hover:border-pink-500/30",
      iconBg: "bg-pink-500/10 text-pink-500 dark:text-pink-400",
      stroke: "#ec4899",
      fill: "rgba(236, 72, 153, 0.05)",
    }
  }

  const style = getThemeStyles(title)

  return (
    <Card className={cn(
      "group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br bg-card/45 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5",
      style.bg
    )}>
      <CardContent className="flex flex-col justify-between p-4 h-full min-h-[120px]">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{title}</p>
            <p className="text-2xl font-bold tracking-tight text-foreground transition-all duration-300 group-hover:scale-[1.02]">
              {value}
            </p>
          </div>
          <div className={cn(
            "flex size-9 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6",
            style.iconBg
          )}>
            <Icon className="size-4.5" />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors duration-300",
              trend === "up" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              trend === "down" && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
              trend === "neutral" && "bg-muted text-muted-foreground"
            )}>
              {trend === "up" && <ArrowUpRight className="size-3" />}
              {trend === "down" && <ArrowDownRight className="size-3" />}
              {trend === "neutral" && <Minus className="size-3" />}
              {change.split(" ")[0]}
            </span>
            <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
              {change.substring(change.indexOf(" ") + 1)}
            </span>
          </div>

          {hasSparkline && (
            <div className="shrink-0 transition-opacity duration-300 group-hover:opacity-100 opacity-85">
              <svg width={width} height={height} className="overflow-visible">
                <defs>
                  <linearGradient id={`gradient-${title.replace(/\s+/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={style.stroke} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={style.stroke} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d={fillPath}
                  fill={`url(#gradient-${title.replace(/\s+/g, "")})`}
                />
                <path
                  d={svgPath}
                  fill="none"
                  stroke={style.stroke}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

