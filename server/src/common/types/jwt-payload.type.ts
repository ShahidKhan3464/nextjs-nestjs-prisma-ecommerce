import { UserRole } from 'src/common/enums/user-role.enum';

export type JwtAccessTokenPayload = {
  sub: number;
  email: string;
  roles: UserRole[];
};
