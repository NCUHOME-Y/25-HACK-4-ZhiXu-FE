import {
  Label,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import { ChartContainer } from "../ui/chart";

/**
 * 环形进度条组件 - 修复显示和变灰问题
 * - 采用 recharts 的 background 属性绘制坚实的背景轨道，解决透明问题。
 * - 进度条颜色直接使用 'fill-primary'，使其不受父组件 opacity 影响。
 * - 绘制方向从顶部开始顺时针。
 */
const EasyRadial = ({ value }: { value: number }) => {
  const safeValue = Math.min(Math.max(value, 0), 100);
  const chartData = [{ progress: safeValue }];
  const chartConfig = {
    progress: {
      label: "Progress",
      color: "hsl(var(--chart-1))", // 使用 CSS 变量以获得主题适应性
    },
  };

  const size = 56;
  const innerRadius = Math.round(size * 0.32);
  const outerRadius = Math.round(size * 0.5);
  // 从顶部 (90度) 开始，顺时针计算结束角度
  const endAngle = 90 + (safeValue / 100) * 360;

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-square shrink-0"
      style={{ width: size, height: size }}
    >
      <RadialBarChart
        data={chartData}
        startAngle={90}
        endAngle={450} // 背景圈画满360度 (90 + 360)
        innerRadius={innerRadius}
        outerRadius={outerRadius}
      >
        {/* 背景轨道 */}
        <RadialBar
          background
          dataKey="progress"
          className="fill-muted"
          cornerRadius={10}
        />
        {/* 前景进度条 */}
        <RadialBar
          dataKey="progress"
          className="fill-primary" // 直接使用主色，不受父级 opacity 影响
          cornerRadius={10}
          endAngle={endAngle} // 动态设置前景的结束角度
        />
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
                      className="fill-foreground text-xs font-bold"
                    >
                      {Math.round(safeValue)}%
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  );
};

export { EasyRadial };
