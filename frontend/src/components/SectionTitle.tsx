import React from 'react';

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  accent?: string;
  sub?: string;
  right?: React.ReactNode;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  eyebrow,
  title,
  accent,
  sub,
  right,
}) => (
  <div className="flex items-end justify-between gap-3 pt-1 pb-3 px-5">
    <div className="flex-1 min-w-0">
      {eyebrow && (
        <p className="text-[10.5px] font-extrabold text-cyan tracking-[0.14em] uppercase mb-1">
          {eyebrow}
        </p>
      )}
      <h2 className="text-[22px] font-extrabold text-ink tracking-[-0.02em] leading-[1.15]">
        {title}{' '}
        {accent && <em className="serif-accent">{accent}</em>}
      </h2>
      {sub && <p className="text-xs text-ink-muted mt-1 font-medium">{sub}</p>}
    </div>
    {right}
  </div>
);
