"use client"

import { TrendingUp } from "lucide-react"
import { Pie, PieChart } from "recharts"

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

export const description = "A pie chart with a label"

interface ChartPieLabelProps {
  data?: Array<{ browser: string; visitors: number; fill: string }>;
  title?: string;
  description?: string;
  showFooter?: boolean;
}

export function ChartPieLabel({ 
  data,
  title = "Pie Chart - Label",
  description = "January - June 2024",
  showFooter = true
}: ChartPieLabelProps = {}) {
  const chartData = data || [
    { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
    { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
    { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
    { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
    { browser: "other", visitors: 90, fill: "var(--color-other)" },
  ];

  const chartConfig: ChartConfig = {
    visitors: {
      label: "数量",
    },
    ...Object.fromEntries(
      chartData.map((item, index) => [
        item.browser.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, ''),
        {
          label: item.browser,
          color: item.fill || `var(--chart-${index + 1})`,
        },
      ])
    ),
  };

  return (
    <Card className="flex flex-col bg-transparent border-none shadow-none p-1">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px] pb-0"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey="visitors" label nameKey="browser" />
          </PieChart>
        </ChartContainer>
      </CardContent>
      {showFooter && (
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 leading-none font-medium">
            本月增长 5.2% <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground leading-none">
            显示最近6个月的总数据
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
