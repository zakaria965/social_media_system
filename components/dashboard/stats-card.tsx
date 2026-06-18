"use client"

import { type LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  change?: string | null
  trend?: "up" | "down" | "neutral"
  icon: LucideIcon
  sparkline?: number[]
  emptyMessage?: string
}

export function StatsCard({ title, value, change, trend, icon: Icon, sparkline, emptyMessage }: StatsCardProps) {
  const hasSparkline = sparkline && sparkline.length > 1 && sparkline.some(v => v > 0)
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

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-none bg-white transition-all duration-200 shadow-card hover:-translate-y-0.5 hover:shadow-card-hover">
      <CardContent className="flex flex-col justify-between p-4 h-full min-h-[120px]">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold tracking-wider text-[#6B7280] uppercase">{title}</p>
            <p className="text-2xl font-bold tracking-tight text-[#111827] transition-all duration-200">
              {value}
            </p>
          </div>
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#DCFCE7] text-[#22C55E] transition-all duration-200">
            <Icon className="size-4.5" />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {change ? (
              <>
                <span className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold transition-colors duration-200 shrink-0",
                  trend === "up" && "bg-emerald-500/10 text-[#22C55E]",
                  trend === "down" && "bg-rose-500/10 text-rose-600",
                  trend === "neutral" && "bg-muted text-muted-foreground"
                )}>
                  {trend === "up" && <ArrowUpRight className="size-2.5" />}
                  {trend === "down" && <ArrowDownRight className="size-2.5" />}
                  {trend === "neutral" && <Minus className="size-2.5" />}
                  {change.split(" ")[0]}
                </span>
                <span className="text-[9.5px] font-medium text-[#6B7280] truncate">
                  {change.substring(change.indexOf(" ") + 1)}
                </span>
              </>
            ) : emptyMessage ? (
              <span className="text-[9.5px] font-medium text-[#94A3B8] leading-normal line-clamp-2">
                {emptyMessage}
              </span>
            ) : null}
          </div>

          {hasSparkline && (
            <div className="shrink-0 opacity-50">
              <svg width={width} height={height} className="overflow-visible">
                <defs>
                  <linearGradient id={`gradient-${title.replace(/\s+/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d={fillPath}
                  fill={`url(#gradient-${title.replace(/\s+/g, "")})`}
                />
                <path
                  d={svgPath}
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="1.25"
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
