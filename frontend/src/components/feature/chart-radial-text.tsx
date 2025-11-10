"use client"

import { TrendingUp } from "lucide-react"
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card"
import { type ChartConfig, ChartContainer } from "../ui/chart"

export const description = "A radial chart with text"

interface ChartRadialTextProps {
  value: number
  total: number
  title?: string
  description?: string
  valueLabel?: string
  showFooter?: boolean
}

export function ChartRadialText({ 
  value, 
  total, 
  title = "完成进度",
  description = "本月统计",
  valueLabel = "个",
  showFooter = true
}: ChartRadialTextProps) {
  const chartData = [
    { category: "completed", count: value, fill: "var(--color-completed)" },
  ]

  const chartConfig = {
    count: {
      label: "完成数",
    },
    completed: {
      label: "已完成",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig

  const percentage = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={0}
            endAngle={250}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey="count" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-4xl font-bold"
                        >
                          {value.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {valueLabel}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      {showFooter && (
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 leading-none font-medium">
            完成率 {percentage}% <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground leading-none">
            已完成 {value} / 总计 {total}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
