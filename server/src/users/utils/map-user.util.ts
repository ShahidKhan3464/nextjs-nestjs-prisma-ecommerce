import { User } from '../entities/user.entity';
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
    role: user.role,
    email: user.email,
    fullName: user.fullName,
    isBlocked: user.isBlocked,
    createDate: user.createDate,
    updateDate: user.updateDate,
    phoneNumber: user.phoneNumber,
  };
}
