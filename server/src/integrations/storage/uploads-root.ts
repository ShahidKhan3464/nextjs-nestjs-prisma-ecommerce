import { join } from 'path';

/**
 * Root folder for locally stored uploads (product images, profile photos, etc.).
 * Honors optional `UPLOADS_ROOT`; otherwise `{cwd}/uploads` (unchanged default).
 */
export function getUploadsRoot(): string {
  const configured = process.env.UPLOADS_ROOT?.trim();
  return configured ? configured : join(process.cwd(), 'uploads');
}

/** Subfolders under `uploads/` — keep paths stable for URLs like `/uploads/{subdir}/...`. */
export const UploadSubdir = {
  SELLERS: 'sellers',
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  STORES: 'stores',
} as const;
