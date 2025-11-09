import {
  Label,
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
  const innerRadius = Math.round(size * 0.35);
  const outerRadius = Math.round(size * 0.5);

  // 文本尺寸与显示策略
  const showCompactLabel = size <= 40;
  const mainFontPx = showCompactLabel ? Math.max(10, Math.round(size * 0.28)) : Math.max(12, Math.round(size * 0.32));
  const subFontPx = showCompactLabel ? Math.max(8, Math.round(size * 0.14)) : Math.max(10, Math.round(size * 0.16));
  const compactTop = labelTop ?? `${current}/${total}`;
  const defaultTop = labelTop ?? `${Math.round(progressPercentage)}%`;

  const chartData = [{ value: progressPercentage }];
  
  const chartConfig = {
    value: {
      label: "进度",
      color: color,
    },
  };

  return (
    <div className={className} style={{ width: size, height: size }}>
      <ChartContainer config={chartConfig} className="mx-auto aspect-square">
        <RadialBarChart
          data={chartData}
          startAngle={90}
          endAngle={90 + 360}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
        >
          <RadialBar
            dataKey="value"
            background={true}
            fill={color}
            cornerRadius={size > 40 ? 6 : 3}
            isAnimationActive={false}
          />
          {showLabel && (
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const cx = viewBox.cx as number;
                    const cy = viewBox.cy as number;

                    if (showCompactLabel) {
                      // 小尺寸：单行紧凑文本（count/total）
                      return (
                        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={cx} y={cy} fill="var(--foreground)" fontWeight={600} fontSize={mainFontPx}>
                            {compactTop}
                          </tspan>
                        </text>
                      );
                    }

                    // 大尺寸：主文本 +（可选）子文本
                    return (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={cx} y={cy} fill="var(--foreground)" fontWeight={700} fontSize={mainFontPx}>
                          {defaultTop}
                        </tspan>
                        {labelBottom && (
                          <tspan x={cx} y={cy + Math.round(size * 0.24)} fill="var(--muted-foreground)" fontSize={subFontPx}>
                            {labelBottom}
                          </tspan>
                        )}
                      </text>
                    );
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
