import { UserWithRoles } from 'src/common/types/user-with-roles.type';
import { extractUserRoles } from 'src/common/utils/authorization.util';
import type { UserResponse } from '../types/user.types';

export type { UserResponse, UserMeResponse } from '../types/user.types';

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
