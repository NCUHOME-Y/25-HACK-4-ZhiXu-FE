"use client"

import { TrendingUp } from "lucide-react"
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart"

export const description = "A radial chart with stacked sections"

// 数据将从外部传入,这里设置默认值
let chartData = [{ month: "current", completed: 0, uncompleted: 0 }]

// 暴露设置数据的函数
export function setChartData(completed: number, uncompleted: number) {
  chartData = [{ month: "current", completed, uncompleted }]
}

const chartConfig = {
  completed: {
    label: "已完成",
    color: "#10b981",
  },
  uncompleted: {
    label: "未完成",
    color: "#f59e0b",
  },
} satisfies ChartConfig

export function ChartRadialStacked() {
  const totalFlags = chartData[0].completed + chartData[0].uncompleted

  return (
  <Card className="flex flex-col bg-transparent border-0 shadow-none p-0 m-0 mb-6">
      <CardHeader className="items-center p-0 m-0 mt-4">
        <CardTitle className="text-2xl p-0 m-0">Flag完成进度</CardTitle>
        <CardDescription className="text-xs p-0 m-0">本月Flag达成情况</CardDescription>
      </CardHeader>
      <div className="flex flex-col items-center justify-center p-0 m-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto p-0 m-0"
          style={{ width: 400, height: 220 }}
        >
          <RadialBarChart
            data={chartData}
            width={400}
            height={220}
            endAngle={180}
            innerRadius={90}
            outerRadius={170}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 4}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {totalFlags}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 48}
                          className="fill-muted-foreground text-xl font-bold"
                        >
                          个Flag
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="completed"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-completed)"
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="uncompleted"
              fill="var(--color-uncompleted)"
              stackId="a"
              cornerRadius={5}
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
        <div className="flex flex-col items-center mt-[-30px]">
          <div className="flex items-center gap-1 leading-none text-lg">
            持续进步中 <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground leading-none text-base mt-1">
            已完成 {chartData[0].completed} 个,未完成 {chartData[0].uncompleted} 个
          </div>
        </div>
      </div>
    </Card>
  )
}
