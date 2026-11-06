import React from 'react';
import { buildCurvedTextLayoutSpec } from '../utils/rules';

export interface CurvedTextArcProps {
  id: string;
  primaryText: string;
  secondaryText?: string;
  testId?: string;
  compact?: boolean;
  className?: string;
}

export const CurvedTextArc: React.FC<CurvedTextArcProps> = ({
  id,
  primaryText,
  secondaryText = '',
  testId,
  compact = false,
  className = '',
}) => {
  const spec = buildCurvedTextLayoutSpec({
    id,
    primaryText,
    secondaryText,
    width: compact ? 640 : 760,
    height: compact ? 84 : 122,
    arcHeight: compact ? 42 : 68,
  });

  const primaryPathId = `${spec.id}-primary-arc`;
  const secondaryPathId = `${spec.id}-secondary-arc`;

  return (
    <div
      data-testid={testId || `curved-text-arc-${spec.id}`}
      className={`w-full select-none overflow-hidden ${className}`}
    >
      <svg
        viewBox={spec.viewBox}
        className={`w-full ${compact ? 'h-16 sm:h-20' : 'h-24 sm:h-28'} overflow-visible`}
        role="img"
        aria-label={secondaryText ? `${primaryText} / ${secondaryText}` : primaryText}
      >
        <defs>
          <path id={primaryPathId} d={spec.primaryPathD} fill="none" />
          <path id={secondaryPathId} d={spec.secondaryPathD} fill="none" />
        </defs>

        {/* Subtle Architectural Guide Arc */}
        <path
          d={spec.primaryPathD}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.14"
          strokeWidth="1"
        />

        {/* Primary Curved Headline */}
        <text
          fill="currentColor"
          className="font-display"
          style={{
            fontSize: compact ? '21px' : '27px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            fontFamily: "'Syne', 'Cormorant Garamond', serif",
          }}
        >
          <textPath
            href={`#${primaryPathId}`}
            startOffset="50%"
            textAnchor="middle"
          >
            {spec.primaryText}
          </textPath>
        </text>

        {/* Secondary Counter-Arc Subtitle */}
        {secondaryText && (
          <text
            fill="currentColor"
            fillOpacity="0.68"
            style={{
              fontSize: compact ? '11px' : '13px',
              fontStyle: 'italic',
              fontWeight: 600,
              letterSpacing: '0.22em',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
            }}
          >
            <textPath
              href={`#${secondaryPathId}`}
              startOffset="50%"
              textAnchor="middle"
            >
              {spec.secondaryText}
            </textPath>
          </text>
        )}
      </svg>
    </div>
  );
};

export interface CurvedOrbitalSealProps {
  id: string;
  ringText: string;
  centerLabel: string;
  testId?: string;
}

export const CurvedOrbitalSeal: React.FC<CurvedOrbitalSealProps> = ({
  id,
  ringText,
  centerLabel,
  testId,
}) => {
  const pathId = `${id}-orbital-ring`;
  const normalizedRing = `${String(ringText || 'MR. STRANGER · SILENT STUDY ·').toUpperCase()} `;

  return (
    <div
      data-testid={testId || `curved-orbital-seal-${id}`}
      className="inline-flex items-center justify-center shrink-0 select-none"
    >
      <svg
        viewBox="0 0 120 120"
        className="w-24 h-24 sm:w-28 sm:h-28"
        role="img"
        aria-label={`${ringText} ${centerLabel}`}
      >
        <defs>
          <path
            id={pathId}
            d="M 60,60 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0"
            fill="none"
          />
        </defs>
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.16"
          strokeWidth="1"
        />
        <circle
          cx="60"
          cy="60"
          r="31"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.16"
          strokeWidth="1"
        />
        <text
          fill="currentColor"
          style={{
            fontSize: '9.2px',
            fontWeight: 600,
            letterSpacing: '0.19em',
            fontFamily: "'Syne', 'Cormorant Garamond', serif",
          }}
        >
          <textPath href={`#${pathId}`} startOffset="0%">
            {normalizedRing}
          </textPath>
        </text>
        <text
          x="60"
          y="64"
          textAnchor="middle"
          fill="currentColor"
          style={{
            fontSize: '13px',
            fontStyle: 'italic',
            fontWeight: 700,
            letterSpacing: '0.06em',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
          }}
        >
          {centerLabel}
        </text>
      </svg>
    </div>
  );
};

export interface CurvedSectionHeadingProps {
  id: string;
  title: string;
  meta?: string;
}

export const CurvedSectionHeading: React.FC<CurvedSectionHeadingProps> = ({
  id,
  title,
  meta,
}) => {
  const pathId = `section-curve-${id}`;
  return (
    <div className="flex items-center justify-between gap-4">
      <svg
        viewBox="0 0 420 52"
        className="h-11 w-full max-w-[380px] overflow-visible"
        role="img"
        aria-label={title}
      >
        <defs>
          <path id={pathId} d="M 8,42 Q 190,12 410,38" fill="none" />
        </defs>
        <path
          d="M 8,44 Q 190,14 410,40"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.14"
          strokeWidth="1"
        />
        <text
          fill="currentColor"
          style={{
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            fontFamily: "'Syne', 'Cormorant Garamond', serif",
          }}
        >
          <textPath href={`#${pathId}`} startOffset="2%">
            {title.toUpperCase()}
          </textPath>
        </text>
      </svg>
      {meta && (
        <span className="font-mono text-xs text-zinc-400 tabular-nums whitespace-nowrap shrink-0">
          {meta}
        </span>
      )}
    </div>
  );
};
