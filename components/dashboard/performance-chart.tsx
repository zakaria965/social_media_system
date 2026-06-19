"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { BarChart3 } from "lucide-react"

interface DataPoint {
  date: string
  reach: number
  engagement: number
  clicks: number
}

interface PerformanceChartProps {
  timeseries: {
    days_7: DataPoint[]
    days_30: DataPoint[]
    days_90: DataPoint[]
  }
}

export function PerformanceChart({ timeseries }: PerformanceChartProps) {
  const [timeframe, setTimeframe] = useState<"7" | "30" | "90">("7")
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement | null>(null)

  const activeData = timeseries[`days_${timeframe}`] || []
  const count = activeData.length
  const hasData = activeData.some(d => d.reach > 0 || d.engagement > 0 || d.clicks > 0)

  // Calculate scales
  const maxReach = Math.max(...activeData.map(d => d.reach)) || 100
  const maxEngagement = Math.max(...activeData.map(d => d.engagement)) || 10
  const maxClicks = Math.max(...activeData.map(d => d.clicks)) || 5
  
  // Find global absolute max for the Y axis scaling
  const maxVal = Math.max(maxReach, maxEngagement, maxClicks) * 1.15 || 100

  // Dimensions
  const paddingLeft = 60
  const paddingRight = 20
  const paddingTop = 30
  const paddingBottom = 40
  
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 })

  // Listen to window resizing to keep chart fully responsive
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current && svgRef.current.parentElement) {
        setDimensions({
          width: svgRef.current.parentElement.clientWidth,
          height: 320
        })
      }
    }
    
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const { width, height } = dimensions
  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  // Coordinate mapping functions
  const getX = (index: number) => {
    if (count <= 1) return paddingLeft
    return paddingLeft + (index / (count - 1)) * chartWidth
  }

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / maxVal) * chartHeight
  }

  // Build SVG Paths
  let reachPath = ""
  let engagementPath = ""
  let clicksPath = ""

  let reachArea = ""
  let engagementArea = ""
  let clicksArea = ""

  if (count > 1) {
    const reachPoints = activeData.map((d, i) => ({ x: getX(i), y: getY(d.reach) }))
    const engagementPoints = activeData.map((d, i) => ({ x: getX(i), y: getY(d.engagement) }))
    const clicksPoints = activeData.map((d, i) => ({ x: getX(i), y: getY(d.clicks) }))

    reachPath = reachPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    reachArea = `${reachPath} L ${getX(count - 1)} ${paddingTop + chartHeight} L ${getX(0)} ${paddingTop + chartHeight} Z`

    engagementPath = engagementPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    engagementArea = `${engagementPath} L ${getX(count - 1)} ${paddingTop + chartHeight} L ${getX(0)} ${paddingTop + chartHeight} Z`

    clicksPath = clicksPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    clicksArea = `${clicksPath} L ${getX(count - 1)} ${paddingTop + chartHeight} L ${getX(0)} ${paddingTop + chartHeight} Z`
  }

  // Handle Mouse Hovering
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current || count === 0) return

    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left

    // Calculate nearest data point index
    let nearestIndex = 0
    let minDiff = Infinity

    for (let i = 0; i < count; i++) {
      const x = getX(i)
      const diff = Math.abs(x - mouseX)
      if (diff < minDiff) {
        minDiff = diff
        nearestIndex = i
      }
    }

    setHoveredIndex(nearestIndex)
    
    // Position tooltip nicely above the hovered point
    const tooltipX = getX(nearestIndex)
    const tooltipY = Math.min(getY(activeData[nearestIndex].reach), getY(activeData[nearestIndex].engagement)) - 80

    setTooltipPos({
      x: Math.max(paddingLeft, Math.min(width - 160, tooltipX - 80)),
      y: Math.max(10, tooltipY)
    })
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
  }

  // Render Horizontal Grid Lines
  const gridLinesCount = 5
  const gridLines = Array.from({ length: gridLinesCount }, (_, i) => {
    const ratio = i / (gridLinesCount - 1)
    const val = maxVal * ratio
    const y = getY(val)
    return { y, val }
  })

  // Format big numbers
  const formatValue = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }

  // Get index step for rendering dates on X-axis (avoid overcrowding on 30 & 90 day ranges)
  const getXLabelStep = () => {
    if (timeframe === "7") return 1
    if (timeframe === "30") return 5
    return 15
  }

  const labelStep = getXLabelStep()
  const hoveredPoint = hoveredIndex !== null ? activeData[hoveredIndex] : null

  return (
    <Card className="rounded-xl border border-border/50 bg-card/45 backdrop-blur-md">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">Performance Overview</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Track organic reach, click metrics, and account engagement trends.</p>
        </div>
        <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border/30 self-start sm:self-auto">
          {(["7", "30", "90"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setTimeframe(tab)
                setHoveredIndex(null)
              }}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                timeframe === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab} Days
            </button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="relative p-0 sm:px-4 pb-4 overflow-visible">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center h-[280px]">
            <div className="p-4 bg-muted/40 rounded-full mb-3">
              <BarChart3 className="size-8 text-muted-foreground/60 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-foreground">No analytics data available yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Connect your social channels and publish content to start tracking your performance.
            </p>
          </div>
        ) : (
          <>
            {/* Metric Legends */}
            <div className="flex items-center gap-4 px-6 pb-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" />
                <span className="font-medium text-muted-foreground">Reach</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/30" />
                <span className="font-medium text-muted-foreground">Engagement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/30" />
                <span className="font-medium text-muted-foreground">Clicks</span>
              </div>
            </div>

            {/* SVG Drawing Canvas */}
            <svg
              ref={svgRef}
              width={width}
              height={height}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="overflow-visible select-none cursor-crosshair"
            >
              {/* Gradients */}
              <defs>
                <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {gridLines.map((line, i) => (
                <g key={i} className="opacity-40">
                  <line
                    x1={paddingLeft}
                    y1={line.y}
                    x2={width - paddingRight}
                    y2={line.y}
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    className="text-border/60"
                  />
                  <text
                    x={paddingLeft - 10}
                    y={line.y + 4}
                    textAnchor="end"
                    className="fill-muted-foreground text-[10px] font-medium"
                  >
                    {formatValue(Math.round(line.val))}
                  </text>
                </g>
              ))}

              {count > 1 && (
                <>
                  {/* Fill Areas */}
                  <path d={reachArea} fill="url(#reachGrad)" className="transition-all duration-300" />
                  <path d={engagementArea} fill="url(#engGrad)" className="transition-all duration-300" />
                  <path d={clicksArea} fill="url(#clickGrad)" className="transition-all duration-300" />

                  {/* Line Paths */}
                  <path
                    d={reachPath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300"
                  />
                  <path
                    d={engagementPath}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300"
                  />
                  <path
                    d={clicksPath}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300"
                  />

                  {/* Horizontal Dates Labels */}
                  {activeData.map((d, i) => {
                    if (i % labelStep !== 0 && i !== count - 1) return null
                    return (
                      <text
                        key={i}
                        x={getX(i)}
                        y={height - paddingBottom + 20}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[10px] font-medium"
                      >
                        {d.date}
                      </text>
                    )
                  })}

                  {/* Hover Guidelines and Highlight Nodes */}
                  {hoveredIndex !== null && (
                    <g>
                      <line
                        x1={getX(hoveredIndex)}
                        y1={paddingTop}
                        x2={getX(hoveredIndex)}
                        y2={paddingTop + chartHeight}
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="text-muted-foreground/35"
                      />
                      {/* Reach Dot */}
                      <circle
                        cx={getX(hoveredIndex)}
                        cy={getY(activeData[hoveredIndex].reach)}
                        r="5"
                        fill="#10b981"
                        stroke="var(--bg-card)"
                        strokeWidth="1.5"
                        className="shadow-sm"
                      />
                      {/* Engagement Dot */}
                      <circle
                        cx={getX(hoveredIndex)}
                        cy={getY(activeData[hoveredIndex].engagement)}
                        r="5"
                        fill="#6366f1"
                        stroke="var(--bg-card)"
                        strokeWidth="1.5"
                        className="shadow-sm"
                      />
                      {/* Clicks Dot */}
                      <circle
                        cx={getX(hoveredIndex)}
                        cy={getY(activeData[hoveredIndex].clicks)}
                        r="5"
                        fill="#f59e0b"
                        stroke="var(--bg-card)"
                        strokeWidth="1.5"
                        className="shadow-sm"
                      />
                    </g>
                  )}
                </>
              )}
            </svg>

            {/* Dynamic Float Tooltip Modal */}
            {hoveredIndex !== null && hoveredPoint && (
              <div
                className="absolute z-10 pointer-events-none rounded-lg border border-border/80 bg-background/95 p-3 shadow-xl backdrop-blur-sm transition-all duration-150 flex flex-col gap-1 w-[150px]"
                style={{
                  left: `${tooltipPos.x}px`,
                  top: `${tooltipPos.y}px`
                }}
              >
                <span className="text-[10px] font-semibold text-muted-foreground uppercase border-b border-border/40 pb-1 mb-1">
                  {hoveredPoint.date}
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Reach
                  </span>
                  <span className="font-bold text-foreground">{hoveredPoint.reach.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-indigo-500" />
                    Engage
                  </span>
                  <span className="font-bold text-foreground">{hoveredPoint.engagement.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-amber-500" />
                    Clicks
                  </span>
                  <span className="font-bold text-foreground">{hoveredPoint.clicks.toLocaleString()}</span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
