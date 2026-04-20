function getViteEnvValue(name: string): string {
  if (typeof import.meta === 'undefined' || !import.meta.env) return '';
  const value = import.meta.env[name as keyof ImportMetaEnv];
  return typeof value === 'string' ? value.trim() : '';
}

function readBooleanFlag(name: string, fallback: boolean): boolean {
  const raw = getViteEnvValue(name).toLowerCase();
  if (!raw) return fallback;
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

export const ENABLE_LICHESS_OPENING_EXPLORER = readBooleanFlag(
  'VITE_ENABLE_LICHESS_OPENING_EXPLORER',
  false,
);

export const LICHESS_EXPLORER_PROXY_URL = getViteEnvValue('VITE_LICHESS_EXPLORER_PROXY_URL');
