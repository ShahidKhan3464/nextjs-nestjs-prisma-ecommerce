import { User } from 'src/generated/prisma/client';
import { UserRole } from 'src/common/enums/user-role.enum';
import { UserWithRoles } from 'src/common/types/user-with-roles.type';
import {
  extractUserRoles,
  resolvePrimaryRole,
} from 'src/common/utils/authorization.util';

export type UserResponse = {
  id: number;
  email: string;
  role: UserRole;
  createDate: Date;
  fullName: string;
  updateDate: Date;
  isBlocked: boolean;
  phoneNumber: string | null;
};

export type UserMeResponse = UserResponse & {
  avatarUrl?: string;
};

export function mapUserToResponse(user: User | UserWithRoles): UserResponse {
  const userRoles =
    'userRoles' in user && user.userRoles
      ? extractUserRoles(user as UserWithRoles)
      : [];

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isBlocked: user.isBlocked,
    createDate: user.createdAt,
    updateDate: user.updatedAt,
    role: resolvePrimaryRole(userRoles),
    phoneNumber: user.phoneNumber,
  };
}
