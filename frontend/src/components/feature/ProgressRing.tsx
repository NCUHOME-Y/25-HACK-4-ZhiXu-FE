import * as React from "react";

// React is imported for JSX runtime and types; keep the import to satisfy TSX usage

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
 * 更可靠的环形进度条实现（SVG）
 * - 直接用 SVG circle 控制 stroke-dashoffset，避免 Recharts 在数据缩放上的歧义
 * - 当后端或 store 更新 current 时，环会正确反映实时进度
 */
export const ProgressRing: React.FC<ProgressRingProps> = ({
  current,
  total,
  size = 56,
  color = "hsl(var(--chart-1))",
  showLabel = true,
  labelTop,
  labelBottom,
  className = "",
}) => {
  const progress = Math.max(0, Math.min(1, current / Math.max(total, 1)));

  const strokeWidth = Math.max(4, Math.round(size * 0.12));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const showCompactLabel = size < 50;
  const mainFontPx = showCompactLabel ? Math.max(8, Math.round(size * 0.19)) : Math.max(11, Math.round(size * 0.24));
  const subFontPx = showCompactLabel ? Math.max(6, Math.round(size * 0.10)) : Math.max(9, Math.round(size * 0.13));

  const topText = labelTop ?? (showCompactLabel ? `${current}/${total}` : `${Math.round(progress * 100)}%`);

  return (
    <div
      className={className}
      style={{ width: size, height: size, position: "relative", display: "inline-block" }}
      aria-hidden={false}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* 背景圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="var(--muted)"
          fill="none"
        />

        {/* 进度圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="url(#progressGradient)"
          fill="none"
          strokeLinecap={size > 40 ? "round" : "butt"}
          style={{
            transform: `rotate(-90deg)`,
            transformOrigin: "50% 50%",
            strokeDasharray: `${circumference} ${circumference}`,
            strokeDashoffset: dashOffset,
            transition: "stroke-dashoffset 200ms linear",
          }}
        />
      </svg>

      {showLabel && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: mainFontPx, lineHeight: 1, color: "var(--foreground)" }}>{topText}</div>
          {!showCompactLabel && labelBottom && (
            <div style={{ fontSize: subFontPx, color: "var(--muted-foreground)", marginTop: Math.round(size * 0.06) }}>{labelBottom}</div>
          )}
        </div>
      )}
    </div>
  );
}
