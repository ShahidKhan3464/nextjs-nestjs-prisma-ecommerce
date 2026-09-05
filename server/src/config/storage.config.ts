import { registerAs } from '@nestjs/config';
import { getUploadsRoot } from 'src/integrations/storage/uploads-root';

/**
 * Local upload storage settings.
 * Uses the same resolution as `getUploadsRoot()` so ConfigService and helpers stay aligned.
 * Optional `UPLOADS_ROOT` — when unset, defaults to `{cwd}/uploads` (historical behavior).
 */
export default registerAs('storage', () => ({
  uploadsRoot: getUploadsRoot(),
}));
