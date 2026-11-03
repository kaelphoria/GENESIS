import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, lstat, stat, unlink, realpath } from 'node:fs/promises';
import path from 'node:path';

export const MAX_ARTIFACT_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'application/json', 'text/plain']);

function ownerPartition(userId) {
  if (typeof userId !== 'string' || !userId.trim() || userId.length > 256) throw new Error('ARTIFACT_OWNER_REQUIRED');
  return createHash('sha256').update(userId).digest('hex');
}

function detectMediaType(bytes) {
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  const text = bytes.toString('utf8');
  if (!text.includes('\u0000') && Buffer.from(text, 'utf8').equals(bytes)) {
    try { JSON.parse(text); return 'application/json'; } catch {}
    if (bytes.length && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) return 'text/plain';
  }
  return null;
}

function assertPrivateRoot(root, publicDir) {
  const resolvedRoot = path.resolve(root);
  const resolvedPublic = path.resolve(publicDir);
  if (resolvedRoot === resolvedPublic || resolvedRoot.startsWith(`${resolvedPublic}${path.sep}`)) throw new Error('ARTIFACT_STORAGE_MUST_BE_PRIVATE');
  return resolvedRoot;
}

export async function quarantineArtifact({ userId, bytes, storageRoot, publicDir = path.resolve('public') }) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) throw new Error('ARTIFACT_BYTES_REQUIRED');
  if (bytes.length > MAX_ARTIFACT_BYTES) throw new Error('ARTIFACT_TOO_LARGE');
  if (typeof storageRoot !== 'string' || !storageRoot.trim()) throw new Error('ARTIFACT_STORAGE_NOT_CONFIGURED');
  const owner = ownerPartition(userId);
  const mediaType = detectMediaType(bytes);
  if (!mediaType || !ALLOWED_TYPES.has(mediaType)) throw new Error('ARTIFACT_TYPE_NOT_ALLOWED');
  const root = assertPrivateRoot(storageRoot, publicDir);
  await mkdir(root, { recursive: true, mode: 0o700 });
  const realRoot = await realpath(root);
  const realPublic = await realpath(publicDir).catch(() => path.resolve(publicDir));
  if (realRoot === realPublic || realRoot.startsWith(`${realPublic}${path.sep}`)) throw new Error('ARTIFACT_STORAGE_MUST_BE_PRIVATE');
  const rootStat = await stat(realRoot);
  if (!rootStat.isDirectory() || (rootStat.mode & 0o077) !== 0) throw new Error('ARTIFACT_STORAGE_PERMISSIONS_INVALID');
  const directory = path.join(realRoot, 'quarantine', owner);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const realDirectory = await realpath(directory);
  if (realDirectory !== directory || !realDirectory.startsWith(`${realRoot}${path.sep}`)) throw new Error('ARTIFACT_STORAGE_PATH_INVALID');
  const directoryStat = await stat(realDirectory);
  if (!directoryStat.isDirectory() || (directoryStat.mode & 0o077) !== 0) throw new Error('ARTIFACT_STORAGE_PERMISSIONS_INVALID');
  const filename = `${randomUUID()}.quarantine`;
  const absolutePath = path.join(realDirectory, filename);
  const handle = await open(absolutePath, 'wx', 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } catch (error) {
    await handle.close();
    await unlink(absolutePath).catch(() => {});
    throw error;
  }
  await handle.close();
  return {
    storageKey: `quarantine/${owner}/${filename}`,
    mediaType,
    sizeBytes: bytes.length,
    contentHash: createHash('sha256').update(bytes).digest('hex'),
    scanStatus: 'quarantined',
    downloadable: false
  };
}

export async function deleteQuarantinedArtifact({ userId, storageKey, storageRoot, publicDir = path.resolve('public') }) {
  const owner = ownerPartition(userId);
  if (typeof storageKey !== 'string' || !storageKey.startsWith(`quarantine/${owner}/`) || !/^[a-f0-9-]{36}\.quarantine$/.test(storageKey.slice(`quarantine/${owner}/`.length))) throw new Error('ARTIFACT_STORAGE_KEY_INVALID');
  const root = assertPrivateRoot(storageRoot, publicDir);
  const realRoot = await realpath(root);
  const realPublic = await realpath(publicDir).catch(() => path.resolve(publicDir));
  if (realRoot === realPublic || realRoot.startsWith(`${realPublic}${path.sep}`)) throw new Error('ARTIFACT_STORAGE_MUST_BE_PRIVATE');
  const rootStat = await stat(realRoot);
  if (!rootStat.isDirectory() || (rootStat.mode & 0o077) !== 0) throw new Error('ARTIFACT_STORAGE_PERMISSIONS_INVALID');
  const target = path.resolve(realRoot, storageKey);
  if (!target.startsWith(`${realRoot}${path.sep}`)) throw new Error('ARTIFACT_STORAGE_PATH_INVALID');
  const realParent = await realpath(path.dirname(target));
  if (!realParent.startsWith(`${realRoot}${path.sep}`) || realParent !== path.dirname(target)) throw new Error('ARTIFACT_STORAGE_PATH_INVALID');
  const fileStat = await lstat(target);
  if (!fileStat.isFile() || fileStat.isSymbolicLink()) throw new Error('ARTIFACT_STORAGE_OBJECT_INVALID');
  await unlink(target);
  return { deleted: true };
}
