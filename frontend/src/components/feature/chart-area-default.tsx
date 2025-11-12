"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart"

export const description = "A simple area chart"

interface ChartDataPoint {
  label: string
  value: number
}

interface ChartAreaDefaultProps {
  data: ChartDataPoint[]
  title?: string
  description?: string
  valueLabel?: string
  showFooter?: boolean
}

const chartConfig = {
  value: {
    label: "数值",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function ChartAreaDefault({ 
  data, 
  title = "趋势图",
  description = "数据趋势",
  valueLabel = "分钟",
  showFooter = false
}: ChartAreaDefaultProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const average = data.length > 0 ? Math.round(total / data.length) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" labelKey="label" nameKey="value" />}
            />
            <Area
              dataKey="value"
              type="natural"
              fill="var(--color-value)"
              fillOpacity={0.4}
              stroke="var(--color-value)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      {showFooter && (
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              <div className="flex items-center gap-2 leading-none font-medium">
                平均 {average} {valueLabel} <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-muted-foreground flex items-center gap-2 leading-none">
                总计 {total} {valueLabel}
              </div>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
