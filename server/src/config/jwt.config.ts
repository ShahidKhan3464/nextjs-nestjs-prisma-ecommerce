import { registerAs } from '@nestjs/config';
import { JWT_ALGORITHM } from 'src/modules/auth/constants/jwt-algorithm.constants';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export default registerAs('jwt', () => ({
  secret: requiredEnv('JWT_ACCESS_SECRET'),
  accessSecret: requiredEnv('JWT_ACCESS_SECRET'),
  refreshSecret: requiredEnv('JWT_REFRESH_SECRET'),
  resetSecret: requiredEnv('JWT_RESET_SECRET'),
  accessTokenTtl: process.env.JWT_ACCESS_TOKEN_TTL ?? '15m',
  refreshTokenTtl: process.env.JWT_REFRESH_TOKEN_TTL ?? '7d',
  signOptions: { algorithm: JWT_ALGORITHM },
  verifyOptions: { algorithms: [JWT_ALGORITHM] },
}));
