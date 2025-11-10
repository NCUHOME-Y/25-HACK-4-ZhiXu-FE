"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

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

export const description = "A multiple bar chart"

interface ChartBarData {
  category: string
  value1: number
  value2: number
}

interface ChartBarMultipleProps {
  data: ChartBarData[]
  title?: string
  description?: string
  value1Label?: string
  value2Label?: string
  showFooter?: boolean
}

const chartConfig = {
  value1: {
    label: "数据1",
    color: "hsl(var(--chart-1))",
  },
  value2: {
    label: "数据2",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function ChartBarMultiple({ 
  data, 
  title = "对比图表",
  description = "数据对比",
  value1Label = "类型1",
  value2Label = "类型2",
  showFooter = false
}: ChartBarMultipleProps) {
  const total1 = data.reduce((sum, item) => sum + item.value1, 0)
  const total2 = data.reduce((sum, item) => sum + item.value2, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="value1" fill="var(--color-value1)" radius={4} />
            <Bar dataKey="value2" fill="var(--color-value2)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      {showFooter && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 leading-none font-medium">
            {value1Label}: {total1} 次 | {value2Label}: {total2} 次 <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground leading-none">
            总计 {total1 + total2} 次
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
