import React from 'react';

interface ProgressRingProps {
  percentage: number;
  completedText?: string;
  size?: number;
  strokeWidth?: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  completedText = '24 / 35 dars tugatildi',
  size = 110,
  strokeWidth = 9
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center space-x-4 bg-white/90 border border-brand-border/80 rounded-2xl p-4 shadow-soft">
      {/* Circular SVG Ring */}
      <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E6F5EF"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Emerald Gradient / Progress Path */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#159A6B"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Percentage with subtle gold star accent */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold font-serif text-brand-dark leading-none">
            {percentage}%
          </span>
          <span className="text-[9px] text-brand-gold font-semibold uppercase tracking-wider mt-0.5">
            Progress
          </span>
        </div>
      </div>

      {/* Text details */}
      <div className="flex flex-col justify-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-emerald">
          Umumiy natija
        </span>
        <h4 className="text-sm font-semibold text-brand-dark mt-0.5">
          {completedText}
        </h4>
        <p className="text-xs text-brand-secondary mt-1 leading-relaxed">
          Kurs yakunida professional sertifikat taqdim etiladi.
        </p>
      </div>
    </div>
  );
};
