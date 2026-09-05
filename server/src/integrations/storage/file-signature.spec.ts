import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import { BadRequestException } from '@nestjs/common';
import {
  detectFileKind,
  assertDetectedFileKind,
  assertUploadedFileSignature,
} from './file-signature';
import {
  IMAGE_MAX_BYTES,
  DOCUMENT_MAX_BYTES,
} from './constants/storage.constants';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
]);
const PDF = Buffer.from('%PDF-1.4');
const FAKE_JPEG = Buffer.from('not-an-image');

describe('file signature validation', () => {
  it('detects supported magic bytes', () => {
    expect(detectFileKind(JPEG)).toBe('jpeg');
    expect(detectFileKind(PNG)).toBe('png');
    expect(detectFileKind(PDF)).toBe('pdf');
    expect(detectFileKind(FAKE_JPEG)).toBeNull();
  });

  it('accepts matching claimed MIME types', () => {
    expect(assertDetectedFileKind(JPEG, 'image/jpeg', 'image')).toBe('jpeg');
    expect(assertDetectedFileKind(PNG, 'image/png', 'image')).toBe('png');
    expect(assertDetectedFileKind(PDF, 'application/pdf', 'document')).toBe(
      'pdf',
    );
  });

  it('rejects fake JPEG content and MIME mismatches', () => {
    expect(() =>
      assertDetectedFileKind(FAKE_JPEG, 'image/jpeg', 'image'),
    ).toThrow(BadRequestException);
    expect(() => assertDetectedFileKind(PNG, 'image/jpeg', 'image')).toThrow(
      BadRequestException,
    );
    expect(() =>
      assertDetectedFileKind(PDF, 'application/pdf', 'image'),
    ).toThrow(BadRequestException);
  });

  it('validates on-disk files and documents oversized limits separately', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'file-sig-'));
    const path = join(dir, 'ok.jpg');
    await writeFile(path, JPEG);

    await expect(
      assertUploadedFileSignature(path, 'image/jpeg', 'image'),
    ).resolves.toBe('jpeg');

    expect(IMAGE_MAX_BYTES).toBe(5 * 1024 * 1024);
    expect(DOCUMENT_MAX_BYTES).toBe(10 * 1024 * 1024);

    await rm(dir, { recursive: true, force: true });
  });
});
