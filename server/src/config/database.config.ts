import { registerAs } from '@nestjs/config';

/** Thin namespaced view of the database connection string (same value as DATABASE_URL). */
export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));
