import React, { useMemo } from 'react';
import { layoutPretextLines } from '../utils/pretextText';

interface PretextLabelProps {
  text: string;
  font: string;
  maxWidth: number;
  maxLines?: number;
  lineHeight?: number;
  className?: string;
  style?: React.CSSProperties;
}

const withEllipsis = (lines: string[], maxLines: number): string[] => {
  if (lines.length <= maxLines) return lines;
  const clipped = lines.slice(0, maxLines);
  const lastIdx = maxLines - 1;
  const last = clipped[lastIdx] || '';
  clipped[lastIdx] = `${last.replace(/[ .,:;!?-]+$/g, '')}...`;
  return clipped;
};

const PretextLabel: React.FC<PretextLabelProps> = ({
  text,
  font,
  maxWidth,
  maxLines = 2,
  lineHeight = 1.2,
  className,
  style,
}) => {
  const lines = useMemo(() => {
    const computed = layoutPretextLines(text, font, maxWidth, lineHeight);
    return withEllipsis(computed, maxLines);
  }, [font, lineHeight, maxLines, maxWidth, text]);

  return (
    <span className={className} style={style}>
      {lines.map((line, idx) => (
        <span key={`${line}-${idx}`} style={{ display: 'block', lineHeight }}>
          {line}
        </span>
      ))}
    </span>
  );
};

export default PretextLabel;

