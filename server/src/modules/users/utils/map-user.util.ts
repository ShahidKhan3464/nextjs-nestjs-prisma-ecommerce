import { UserRole } from 'src/common/enums/user-role.enum';
import { UserWithRoles } from 'src/common/types/user-with-roles.type';
import { extractUserRoles } from 'src/common/utils/authorization.util';

export type UserResponse = {
  id: number;
  email: string;
  createDate: Date;
  fullName: string;
  updateDate: Date;
  roles: UserRole[];
  isBlocked: boolean;
  phoneNumber: string | null;
};

export type UserMeResponse = UserResponse & {
  avatarUrl?: string;
};

export function mapUserToResponse(user: UserWithRoles): UserResponse {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isBlocked: user.isBlocked,
    createDate: user.createdAt,
    updateDate: user.updatedAt,
    roles: extractUserRoles(user),
    phoneNumber: user.phoneNumber,
  };
}
