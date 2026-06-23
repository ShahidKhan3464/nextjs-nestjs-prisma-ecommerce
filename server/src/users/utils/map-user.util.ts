import { User } from 'src/generated/prisma/client';
import { UserRole } from '../constants/user.constants';

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

export function mapUserToResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isBlocked: user.isBlocked,
    createDate: user.createDate,
    updateDate: user.updateDate,
    role: user.role as UserRole,
    phoneNumber: user.phoneNumber,
  };
}
