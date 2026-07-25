import { UserRole } from 'src/common/enums/user-role.enum';
import { JwtTokenType } from 'src/modules/auth/constants/jwt-token-type.enum';

export type JwtAccessTokenPayload = {
  sub: number;
  email: string;
  roles: UserRole[];
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
};

export type JwtEmailVerificationPayload = {
  sub: number;
  typ: JwtTokenType.EMAIL_VERIFICATION;
};
