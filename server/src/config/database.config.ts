import { registerAs } from '@nestjs/config';
import { parseEnvBoolean } from './parse-env-boolean.util';

export default registerAs('database', () => ({
  database: process.env.DATABASE_NAME,
  port: process.env.DATABASE_PORT || 5432,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  host: process.env.DATABASE_HOST || 'localhost',
  synchronize: parseEnvBoolean(process.env.DATABASE_SYNCHRONIZE, false),
  autoLoadEntities: parseEnvBoolean(
    process.env.DATABASE_AUTO_LOAD_ENTITIES,
    true,
  ),
}));
