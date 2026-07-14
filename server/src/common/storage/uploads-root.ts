import { join } from 'path';

/** Root folder for locally stored uploads (product images, future profile photos, etc.). */
export function getUploadsRoot(): string {
  return join(process.cwd(), 'uploads');
}

/** Subfolders under `uploads/` — keep paths stable for URLs like `/uploads/{subdir}/...`. */
export const UploadSubdir = {
  SELLERS: 'sellers',
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
} as const;
