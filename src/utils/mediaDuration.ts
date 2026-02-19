export const LAWBAMP_MAX_UPLOAD_DURATION_SEC = 30 * 60;

type MediaKind = 'audio' | 'video';

function guessMediaKind(file: File): MediaKind {
  const t = (file.type || '').toLowerCase();
  if (t.startsWith('video/')) return 'video';
  return 'audio';
}

/**
 * Reads the media duration (in seconds) from a local File by loading metadata.
 * This is best-effort and depends on browser codec support.
 */
export async function getMediaDurationSec(file: File): Promise<number> {
  if (!file) throw new Error('No file provided');

  const kind = guessMediaKind(file);
  const el = document.createElement(kind === 'video' ? 'video' : 'audio');
  el.preload = 'metadata';

  const url = URL.createObjectURL(file);
  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const onLoaded = () => {
        const d = Number(el.duration);
        cleanup();
        if (!Number.isFinite(d) || d <= 0) reject(new Error('Could not read media duration'));
        else resolve(d);
      };
      const onError = () => {
        cleanup();
        reject(new Error('Could not load media metadata'));
      };
      const cleanup = () => {
        el.removeEventListener('loadedmetadata', onLoaded);
        el.removeEventListener('error', onError);
      };

      el.addEventListener('loadedmetadata', onLoaded);
      el.addEventListener('error', onError);
      el.src = url;
    });

    return duration;
  } finally {
    try {
      el.removeAttribute('src');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (el as any).load?.();
    } catch {}
    URL.revokeObjectURL(url);
  }
}

export function assertDurationWithinLawbampCap(durationSec: number): void {
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    throw new Error('Could not determine media duration');
  }
  if (durationSec > LAWBAMP_MAX_UPLOAD_DURATION_SEC) {
    const maxM = Math.floor(LAWBAMP_MAX_UPLOAD_DURATION_SEC / 60);
    throw new Error(`Upload too long. Max length is ${maxM} minutes.`);
  }
}

