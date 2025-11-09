// 环形进度简易组件（SVG）
export const CircleProgress = ({ value }: { value: number }) => {
    const size = 56;
    const stroke = 6;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const offset = c * (1 - Math.min(Math.max(value, 0), 100) / 100);
    return (
      <svg width={size} height={size} className="shrink-0">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#eee" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="oklch(0.75 0.15 80)"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
        />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="10" fill="#444">
          {Math.round(value)}%
        </text>
      </svg>
    );
  };
  
  // 任务进度（计次）
  export const TaskRing = ({ count = 0, total = 1 }: { count?: number; total?: number }) => {
    const pct = Math.min(100, Math.round((count / Math.max(total, 1)) * 100));
    return <CircleProgress value={pct} />;
  };
  