import { existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { config as loadDotEnv } from 'dotenv';

const __dirname = resolve(fileURLToPath(new URL('.', import.meta.url)));
const ENV_PATH = resolve(__dirname, '.env');

function missing(name) {
  const value = process.env[name];
  return !value || !String(value).trim();
}

export function runPreflight({ strict = true } = {}) {
  loadDotEnv({ path: ENV_PATH });

  const errors = [];
  const warnings = [];

  const requiredEnv = [
    'FIREBASE_SERVICE_ACCOUNT_PATH',
    'FIREBASE_DATABASE_URL',
    'OPENROUTER_API_KEY',
    'RETAKE_SOLANA_KEYPAIR_PATH',
    'JUPITER_API_KEY',
  ];

  for (const key of requiredEnv) {
    if (missing(key)) errors.push(`Missing env var: ${key}`);
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : null;
  if (serviceAccountPath && !existsSync(serviceAccountPath)) {
    errors.push(`Missing Firebase service account file: ${serviceAccountPath}`);
  }

  const solKeypairPath = process.env.RETAKE_SOLANA_KEYPAIR_PATH
    ? resolve(process.env.RETAKE_SOLANA_KEYPAIR_PATH)
    : null;
  if (solKeypairPath && !existsSync(solKeypairPath)) {
    errors.push(`Missing Solana keypair file: ${solKeypairPath}`);
  }

  if (missing('OBS_WS_PASSWORD')) {
    warnings.push('OBS_WS_PASSWORD not set (stream control may fail).');
  }

  if (errors.length && strict) {
    const msg = ['[preflight] failed:', ...errors.map((e) => ` - ${e}`)].join('\n');
    throw new Error(msg);
  }

  return { ok: errors.length === 0, errors, warnings };
}

