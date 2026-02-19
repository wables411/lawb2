import { ref as dbRef, query, limitToLast, get } from 'firebase/database';
import { database } from './firebaseApp';
import { assertDurationWithinLawbampCap, getMediaDurationSec } from './utils/mediaDuration';

export type LawbampUploadEntry = {
  id: string;
  uploader: string; // lowercase wallet
  title: string;
  filename: string;
  mime: string;
  bytes: number;
  duration_sec: number;
  created_at: number; // ms since epoch
  storage_url: string; // Firebase Storage download URL
};

function sanitizeTitle(raw: string): string {
  const t = (raw || '').trim().slice(0, 120);
  return t || 'Untitled';
}

function sanitizeFilename(raw: string): string {
  const base = (raw || 'upload').trim().slice(0, 120);
  // Avoid path separators and weird characters in storage keys.
  return base.replace(/[^\w.\-() ]+/g, '_');
}

function buildAuthMessage(p: { address: string; nonce: string; issuedAt: number; expiresAt: number }): string {
  return [
    'LAWBAMP_UPLOAD',
    `address:${p.address}`,
    `nonce:${p.nonce}`,
    `issuedAt:${p.issuedAt}`,
    `expiresAt:${p.expiresAt}`,
  ].join('\n');
}

function xhrPut(url: string, file: File, headers: Record<string, string>, onProgress?: (pct01: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => {
      if (!onProgress) return;
      if (!e.lengthComputable) return;
      onProgress(e.total > 0 ? e.loaded / e.total : 0);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Upload network error'));
    xhr.send(file);
  });
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text().catch(() => '');
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) ? String(data.message || data.error) : `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return data as T;
}

export async function uploadLawbampMedia(args: {
  uploaderAddress: string;
  file: File;
  title?: string;
  onProgress?: (pct01: number) => void;
  signMessageAsync: (args: { message: string }) => Promise<`0x${string}`>;
}): Promise<LawbampUploadEntry> {
  const uploader = (args.uploaderAddress || '').toLowerCase();
  if (!uploader.startsWith('0x') || uploader.length < 10) throw new Error('Connect wallet to upload');
  const file = args.file;
  if (!file) throw new Error('No file selected');

  const mime = (file.type || '').toLowerCase();
  if (!(mime.startsWith('audio/') || mime.startsWith('video/'))) {
    throw new Error('Unsupported file type. Upload an audio or video file.');
  }

  // Enforce 30-minute cap by reading the media metadata before uploading bytes.
  const durationSec = await getMediaDurationSec(file);
  assertDurationWithinLawbampCap(durationSec);

  const filename = sanitizeFilename(file.name);
  const title = sanitizeTitle(args.title || file.name);

  // 1) Get an auth token for this address.
  const authUrl = new URL('/.netlify/functions/lawbamp-upload-auth', window.location.origin);
  authUrl.searchParams.set('address', uploader);
  const auth = await fetchJson<{ token: string; payload: { address: string; nonce: string; issuedAt: number; expiresAt: number } }>(authUrl.toString());

  // 2) Sign the canonical message (server verifies signature).
  const message = buildAuthMessage(auth.payload);
  const signature = await args.signMessageAsync({ message });

  // 3) Init upload: server checks Lawbsters/Lawbstarz, returns a signed PUT URL into Firebase Storage.
  const initUrl = new URL('/.netlify/functions/lawbamp-upload-init', window.location.origin);
  const initRes = await fetchJson<{
    entryId: string;
    objectPath: string;
    uploadUrl: string;
    requiredHeaders: Record<string, string>;
    downloadUrl: string;
  }>(initUrl.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: uploader,
      token: auth.token,
      signature,
      title,
      filename,
      mime: file.type || 'application/octet-stream',
      bytes: file.size,
      duration_sec: Math.round(durationSec),
    }),
  });

  // 4) Upload bytes directly to signed URL (no Netlify payload limits).
  await xhrPut(initRes.uploadUrl, file, initRes.requiredHeaders || { 'content-type': file.type || 'application/octet-stream' }, args.onProgress);

  // 5) Finalize: server writes the RTDB metadata (clients cannot).
  const finalizeUrl = new URL('/.netlify/functions/lawbamp-upload-finalize', window.location.origin);
  const fin = await fetchJson<{ ok: boolean; entry: LawbampUploadEntry }>(finalizeUrl.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: uploader,
      token: auth.token,
      signature,
      entryId: initRes.entryId,
      filename,
      title,
      mime: file.type || 'application/octet-stream',
      bytes: file.size,
      duration_sec: Math.round(durationSec),
      downloadUrl: initRes.downloadUrl,
      objectPath: initRes.objectPath,
    }),
  });

  return fin.entry;
}

export async function fetchRecentLawbampUploads(limit = 25): Promise<LawbampUploadEntry[]> {
  const q = query(dbRef(database, 'lawbamp_uploads'), limitToLast(Math.max(1, Math.min(100, limit))));
  const snap = await get(q);
  if (!snap.exists()) return [];
  const val = snap.val() as Record<string, any>;
  const entries = Object.entries(val).map(([id, v]) => ({ id, ...(v as any) })) as LawbampUploadEntry[];
  // Newest first.
  entries.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
  return entries;
}

