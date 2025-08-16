
"use client"

import React from 'react';

type ProgressRingProps = {
  value: number;
  radius?: number;
  stroke?: number;
  className?: string;
};

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  radius = 60,
  stroke = 8,
  className,
}) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const scoreColor = 
    value > 75 ? 'hsl(var(--primary))' : 
    value > 40 ? 'hsl(var(--chart-4))' : 
    'hsl(var(--destructive))';

  return (
    <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
      <svg
        height={radius * 2}
        width={radius * 2}
        className="-rotate-90"
      >
        <circle
          stroke="hsl(var(--secondary))"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={scoreColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-300"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold" style={{ color: scoreColor }}>
        {Math.round(value)}
      </span>
    </div>
  );
};

    