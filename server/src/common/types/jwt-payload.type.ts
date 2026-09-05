import { UserRole } from 'src/common/enums/user-role.enum';
import { JwtTokenType } from 'src/modules/auth/constants/jwt-token-type.enum';

export type JwtAccessTokenPayload = {
  sub: number;
  email: string;
  roles: UserRole[];
  tokenVersion: number;
  typ: JwtTokenType.ACCESS;
};

export type JwtRefreshTokenPayload = {
  sub: number;
  typ: JwtTokenType.REFRESH;
  familyId: string;
};

export type JwtPasswordResetPayload = {
  sub: number;
  typ: JwtTokenType.PASSWORD_RESET;
  /** SHA-256 of the password hash at issue time — invalidates the token after reset. */
  pwd: string;
};
