import { SetMetadata } from '@nestjs/common';
import { AUTH_TYPES_KEY, AuthType } from '../constants/auth.constants';

export const Auth = (...authTypes: AuthType[]) =>
  SetMetadata(AUTH_TYPES_KEY, authTypes);
