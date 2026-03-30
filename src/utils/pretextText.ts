import { layoutWithLines, prepareWithSegments } from '@chenglou/pretext';

const PREPARED_CACHE = new Map<string, ReturnType<typeof prepareWithSegments>>();

const getPrepared = (text: string, font: string) => {
  const key = `${font}::${text}`;
  const cached = PREPARED_CACHE.get(key);
  if (cached) return cached;

  const prepared = prepareWithSegments(text, font);
  PREPARED_CACHE.set(key, prepared);
  return prepared;
};

export const layoutPretextLines = (
  text: string,
  font: string,
  maxWidth: number,
  lineHeight = 1.2
): string[] => {
  const normalized = text.trim();
  if (!normalized || maxWidth <= 0) return normalized ? [normalized] : [];

  try {
    const prepared = getPrepared(normalized, font);
    const { lines } = layoutWithLines(prepared, maxWidth, lineHeight);
    const output = lines.map((line) => line.text.trim()).filter((line) => line.length > 0);
    return output.length > 0 ? output : [normalized];
  } catch {
    // Keep UI resilient if layout fails for any edge-case text/font combo.
    return [normalized];
  }
};

