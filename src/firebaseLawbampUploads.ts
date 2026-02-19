import { ref as dbRef, push, set, serverTimestamp, query, limitToLast, get } from 'firebase/database';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { database, storage } from './firebaseApp';
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

export async function uploadLawbampMedia(args: {
  uploaderAddress: string;
  file: File;
  title?: string;
  onProgress?: (pct01: number) => void;
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

  // Create DB entry id up front so storage path and metadata share the same id.
  const entryRef = push(dbRef(database, 'lawbamp_uploads'));
  const entryId = entryRef.key;
  if (!entryId) throw new Error('Could not allocate upload id');

  const key = `lawbamp_uploads/${uploader}/${entryId}/${filename}`;
  const sRef = storageRef(storage, key);

  const task = uploadBytesResumable(sRef, file, {
    contentType: file.type || undefined,
    customMetadata: {
      uploader,
      entryId,
      title,
      filename,
      durationSec: String(Math.round(durationSec)),
    },
  });

  await new Promise<void>((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => {
        if (!args.onProgress) return;
        const pct = snap.totalBytes > 0 ? snap.bytesTransferred / snap.totalBytes : 0;
        args.onProgress(pct);
      },
      (err) => reject(err),
      () => resolve()
    );
  });

  const downloadUrl = await getDownloadURL(task.snapshot.ref);
  const now = Date.now();

  const entry: LawbampUploadEntry = {
    id: entryId,
    uploader,
    title,
    filename,
    mime: file.type || 'application/octet-stream',
    bytes: file.size,
    duration_sec: Math.round(durationSec),
    created_at: now,
    storage_url: downloadUrl,
  };

  // Store metadata in RTDB (this is what Lawbamp and profiles will list).
  // Note: RTDB rules should validate `duration_sec <= 1800`.
  await set(entryRef, {
    ...entry,
    // Keep a server-side timestamp too (optional).
    created_at_server: serverTimestamp(),
  });

  // Secondary index for profile pages.
  await set(dbRef(database, `lawbamp_uploads_by_user/${uploader}/${entryId}`), true);

  return entry;
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

