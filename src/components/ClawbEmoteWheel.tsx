import React, { useEffect, useCallback, useRef } from 'react';
import './ClawbEmoteWheel.css';

export interface EmoteSegment {
  id: string;
  label: string;
  icon: string; // Short text icon (Win98 style, no emojis per spec)
}

const EMOTE_SEGMENTS: EmoteSegment[] = [
  { id: 'idle', label: 'Chill', icon: '~' },
  { id: 'dance1', label: 'Dance', icon: 'd1' },
  { id: 'dance2', label: 'Groove', icon: 'd2' },
  { id: 'dance3', label: 'Vibe', icon: 'd3' },
  { id: 'walk', label: 'Walk', icon: '>>' },
  { id: 'death', label: 'RIP', icon: 'x_x' },
  { id: 'help', label: 'Ask Clawb', icon: '?' },
  { id: 'world', label: 'Visit World', icon: '~o~' },
];

const SEGMENT_COUNT = EMOTE_SEGMENTS.length;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT; // 45 degrees
const RADIUS = 100; // outer radius in px
const INNER_RADIUS = 32; // inner dead zone
const WHEEL_SIZE = RADIUS * 2 + 20; // total wheel container size

interface ClawbEmoteWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (segmentId: string) => void;
  /** Screen position (center of where the wheel appears) */
  position: { x: number; y: number };
}

const ClawbEmoteWheel: React.FC<ClawbEmoteWheelProps> = ({
  isOpen,
  onClose,
  onSelect,
  position,
}) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Close on click outside
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleSegmentClick = useCallback(
    (segmentId: string) => {
      onSelect(segmentId);
      onClose();
    },
    [onSelect, onClose]
  );

  if (!isOpen) return null;

  // Position the wheel so it's centered above the click point
  // Clamp to viewport so it doesn't go off-screen
  const wheelX = Math.max(WHEEL_SIZE / 2 + 8, Math.min(window.innerWidth - WHEEL_SIZE / 2 - 8, position.x));
  const wheelY = Math.max(WHEEL_SIZE / 2 + 8, Math.min(window.innerHeight - WHEEL_SIZE / 2 - 60, position.y - RADIUS - 20));

  return (
    <div className="emote-wheel-backdrop" onClick={handleBackdropClick}>
      <div
        ref={wheelRef}
        className="emote-wheel"
        style={{
          left: wheelX - WHEEL_SIZE / 2,
          top: wheelY - WHEEL_SIZE / 2,
          width: WHEEL_SIZE,
          height: WHEEL_SIZE,
        }}
      >
        {/* SVG pie segments */}
        <svg
          width={WHEEL_SIZE}
          height={WHEEL_SIZE}
          viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
          className="emote-wheel-svg"
        >
          {EMOTE_SEGMENTS.map((seg, i) => {
            const startAngle = i * SEGMENT_ANGLE - 90; // start from top
            const endAngle = startAngle + SEGMENT_ANGLE;
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const cx = WHEEL_SIZE / 2;
            const cy = WHEEL_SIZE / 2;

            // Outer arc
            const x1 = cx + RADIUS * Math.cos(startRad);
            const y1 = cy + RADIUS * Math.sin(startRad);
            const x2 = cx + RADIUS * Math.cos(endRad);
            const y2 = cy + RADIUS * Math.sin(endRad);
            // Inner arc
            const ix1 = cx + INNER_RADIUS * Math.cos(startRad);
            const iy1 = cy + INNER_RADIUS * Math.sin(startRad);
            const ix2 = cx + INNER_RADIUS * Math.cos(endRad);
            const iy2 = cy + INNER_RADIUS * Math.sin(endRad);

            const path = [
              `M ${ix1} ${iy1}`,
              `L ${x1} ${y1}`,
              `A ${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2}`,
              `L ${ix2} ${iy2}`,
              `A ${INNER_RADIUS} ${INNER_RADIUS} 0 0 0 ${ix1} ${iy1}`,
              'Z',
            ].join(' ');

            // Label position (midpoint of segment arc)
            const midAngle = ((startAngle + endAngle) / 2) * (Math.PI / 180);
            const labelR = (RADIUS + INNER_RADIUS) / 2;
            const labelX = cx + labelR * Math.cos(midAngle);
            const labelY = cy + labelR * Math.sin(midAngle);

            const isHovered = hoveredIndex === i;

            return (
              <g
                key={seg.id}
                onClick={() => handleSegmentClick(seg.id)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                <path
                  d={path}
                  className={`emote-segment ${isHovered ? 'hovered' : ''}`}
                />
                <text
                  x={labelX}
                  y={labelY - 5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`emote-label-icon ${isHovered ? 'hovered' : ''}`}
                >
                  {seg.icon}
                </text>
                <text
                  x={labelX}
                  y={labelY + 9}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`emote-label-text ${isHovered ? 'hovered' : ''}`}
                >
                  {seg.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default ClawbEmoteWheel;
