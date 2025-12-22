"use client"

import { useMemo } from 'react'
import { Clock, TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
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
import type { StudyTimeTrend } from '../../lib/types/types'

interface StudyTimeChartProps {
  data: StudyTimeTrend[]
  period: 'week' | 'month' | 'year'
  description?: string
  showFooter?: boolean
}

const chartConfig = {
  minutes: {
    label: "学习时长",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function StudyTimeChart({ 
  data, 
  period,
  description = "查看学习时长统计",
  showFooter = true
}: StudyTimeChartProps) {
  
  // 格式化数据，添加显示标签，并将秒转换为分钟
  const chartData = useMemo(() => {
    console.log(`${period}周期原始数据:`, data);
    return data.map((item, index) => {
      const dateStr = item.date;
      const [yearStr, monthStr, dayStr] = dateStr.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      const day = parseInt(dayStr);
      let label = '';
      if (period === 'week') {
        const date = new Date(year, month - 1, day);
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        label = weekdays[date.getDay()];
      } else if (period === 'month') {
        // 基于日期本身显示标签：每3天显示一次（1、4、7、10、13、16、19、22、25、28、31日）
        // 或者是第一天和最后一天
        const shouldShowLabel = day % 3 === 1 || index === 0 || index === data.length - 1;
        label = shouldShowLabel ? `${day}日` : '';
      } else if (period === 'year') {
        label = `${month}月`;
      }
      // 统一转换为分钟
      const minutes = Math.floor((item.seconds ?? 0) / 60);
      console.log(`数据点[${index}]: 日期=${dateStr}, 月份=${month}, 标签=${label}, 时长=${minutes}`);
      return {
        date: dateStr,
        label,
        displayMinutes: minutes,
        month,
        day,
      };
    });
  }, [data, period]);

  // 计算总学习时长（秒转分钟）
  const totalMinutes = useMemo(() => {
    return data.reduce((sum, item) => sum + Math.floor((item.seconds ?? 0) / 60), 0);
  }, [data]);

  // 格式化时长显示
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
  };

  // 获取周期描述
  const getPeriodDescription = () => {
    switch (period) {
      case 'week':
        return '近7天';
      case 'month':
        return '本月';
      case 'year':
        return '近6月';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-blue-500" />
          {description}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              tickMargin={8}
              axisLine={false}
              fontSize={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}分`}
              fontSize={10}
              width={35}
            />
            <ChartTooltip
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              content={<ChartTooltipContent 
                labelFormatter={(_, payload) => {
                  if (payload && payload.length > 0) {
                    const item = payload[0].payload;
                    return `${item.month}月${item.day}日`;
                  }
                  return '';
                }}
                formatter={(value) => [`${value}分钟`, '学习时长']}
              />}
            />
            <Bar 
              dataKey="displayMinutes" 
              fill="#3B82F6" // 蓝色主色调（Tailwind blue-500）
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      {showFooter && (
        <CardFooter className="flex-col items-start gap-1.5 text-xs border-t border-gray-200 pt-3 px-4">
          <div className="flex items-center gap-1.5 font-medium leading-none">
            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            <span>{getPeriodDescription()}累计 {formatTime(totalMinutes)}</span>
          </div>
          <div className="text-muted-foreground leading-none">
            {period === 'year' ? '平均每月' : '平均每天'} {formatTime(Math.round(totalMinutes / Math.max(data.length, 1)))}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
