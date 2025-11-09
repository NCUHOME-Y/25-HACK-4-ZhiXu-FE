import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import { ChartContainer } from "../ui/chart";

interface ProgressRingProps {
  current: number;
  total: number;
  size?: number;
  color?: string;
  showLabel?: boolean;
  labelTop?: string;
  labelBottom?: string;
  className?: string;
}

/**
 * 通用环形进度图组件
 * 支持百分比显示和自定义标签
 */
export function ProgressRing({ 
  current, 
  total, 
  size = 56, 
  color = "hsl(var(--chart-1))",
  showLabel = true,
  labelTop,
  labelBottom,
  className = ""
}: ProgressRingProps) {
  const progressPercentage = Math.min(100, (current / Math.max(total, 1)) * 100);
  const progressAngle = (progressPercentage / 100) * 360;
  
  const chartData = [{ 
    value: current,
    fill: color
  }];
  
  const chartConfig = {
    value: {
      label: "进度",
      color: color,
    },
  };

  const innerRadius = Math.round(size * 0.35);
  const outerRadius = Math.round(size * 0.5);

  return (
    <div className={className} style={{ width: size, height: size }}>
      <ChartContainer config={chartConfig} className="mx-auto aspect-square">
        <RadialBarChart
          data={chartData}
          startAngle={90}
          endAngle={90 + progressAngle}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
        >
          {size > 40 && (
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[outerRadius - 4, innerRadius]}
            />
          )}
          <RadialBar 
            dataKey="value"
            background
            cornerRadius={size > 40 ? 5 : 3}
            fill={color}
          />
          {showLabel && (
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const fontSize = size > 40 ? "text-lg" : "text-xs";
                    const fontSizeSub = size > 40 ? "text-xs" : "text-[10px]";
                    
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
                          className={`fill-foreground ${fontSize} font-bold`}
                        >
                          {labelTop || `${Math.round(progressPercentage)}%`}
                        </tspan>
                        {labelBottom && (
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + (size > 40 ? 12 : 10)}
                            className={`fill-muted-foreground ${fontSizeSub}`}
                          >
                            {labelBottom}
                          </tspan>
                        )}
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          )}
        </RadialBarChart>
      </ChartContainer>
    </div>
  );
}
