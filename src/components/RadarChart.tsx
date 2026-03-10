import { memo } from "react";
import type { TeamMetric } from "../content";

interface RadarChartProps {
  data: TeamMetric[];
}

export const RadarChart = memo(function RadarChart({ data }: RadarChartProps) {
  const size = 260;
  const center = size / 2;
  const radius = 92;
  const angleStep = (Math.PI * 2) / data.length;

  const getCoordinates = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const distance = (value / 100) * radius;
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    };
  };

  const outerPoints = data.map((_, index) => getCoordinates(100, index));
  const innerPoints = data.map((_, index) => getCoordinates(50, index));
  const dataPoints = data.map((item, index) => getCoordinates(item.value, index));

  return (
    <div className="flex justify-center py-6">
      <svg className="overflow-visible" height={size} width={size}>
        <polygon
          fill="none"
          points={outerPoints.map((point) => `${point.x},${point.y}`).join(" ")}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
        <polygon
          fill="none"
          points={innerPoints.map((point) => `${point.x},${point.y}`).join(" ")}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
        {outerPoints.map((point, index) => (
          <line
            key={`axis-${index}`}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
            x1={center}
            x2={point.x}
            y1={center}
            y2={point.y}
          />
        ))}
        <polygon
          className="transition-all duration-700"
          fill="rgba(212,190,136,0.12)"
          points={dataPoints.map((point) => `${point.x},${point.y}`).join(" ")}
          stroke="#d4be88"
          strokeWidth="1.5"
        />
        {dataPoints.map((point, index) => (
          <circle key={`node-${index}`} cx={point.x} cy={point.y} fill="#ffffff" r="3" />
        ))}
        {data.map((item, index) => {
          const point = getCoordinates(122, index);
          return (
            <text
              key={item.label}
              className="font-display"
              dominantBaseline="middle"
              fill="#8a8d93"
              fontSize="12"
              letterSpacing="0.1em"
              textAnchor="middle"
              x={point.x}
              y={point.y}
            >
              {item.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
});
