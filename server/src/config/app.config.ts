import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  apiVersion: process.env.API_VERSION || 'v1',
  environments: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
}));
