import { open, unlink } from 'fs/promises';
import type { StorageEngine } from 'multer';
import { BadRequestException } from '@nestjs/common';

export type FileSignatureProfile = 'image' | 'document';
export type DetectedFileKind = 'jpeg' | 'png' | 'gif' | 'webp' | 'pdf';

const IMAGE_KINDS = new Set<DetectedFileKind>(['jpeg', 'png', 'gif', 'webp']);
const DOCUMENT_KINDS = new Set<DetectedFileKind>([
  'jpeg',
  'png',
  'webp',
  'pdf',
]);

const MIME_TO_KIND: Record<string, DetectedFileKind> = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

export function detectFileKind(buffer: Buffer): DetectedFileKind | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'jpeg';
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  if (
    buffer.length >= 4 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return 'gif';
  }

  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'webp';
  }

  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'pdf';
  }

  return null;
}

export function assertDetectedFileKind(
  buffer: Buffer,
  claimedMime: string,
  profile: FileSignatureProfile,
): DetectedFileKind {
  const detected = detectFileKind(buffer);
  const allowed = profile === 'image' ? IMAGE_KINDS : DOCUMENT_KINDS;
  const claimedKind = MIME_TO_KIND[(claimedMime ?? '').toLowerCase()];

  if (!detected || !allowed.has(detected)) {
    throw new BadRequestException(
      'Invalid file type. The file contents do not match an allowed format.',
    );
  }

  if (claimedKind && claimedKind !== detected) {
    throw new BadRequestException(
      'File type does not match the uploaded content.',
    );
  }

  return detected;
}

export async function readFilePrefix(
  filePath: string,
  length = 16,
): Promise<Buffer> {
  const handle = await open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

export async function assertUploadedFileSignature(
  filePath: string,
  claimedMime: string,
  profile: FileSignatureProfile,
): Promise<DetectedFileKind> {
  const prefix = await readFilePrefix(filePath);
  return assertDetectedFileKind(prefix, claimedMime, profile);
}

export function wrapDiskStorageWithSignatureCheck(
  storage: StorageEngine,
  profile: FileSignatureProfile,
): StorageEngine {
  return {
    _handleFile(req, file, cb) {
      storage._handleFile(req, file, (err, info) => {
        const storedPath = info?.path;
        if (err || !storedPath) {
          cb(err, info);
          return;
        }

        void assertUploadedFileSignature(storedPath, file.mimetype, profile)
          .then(() => cb(null, info))
          .catch((validationErr: unknown) => {
            void unlink(storedPath).catch(() => undefined);
            cb(validationErr);
          });
      });
    },
    _removeFile(req, file, cb) {
      storage._removeFile(req, file, cb);
    },
  };
}
