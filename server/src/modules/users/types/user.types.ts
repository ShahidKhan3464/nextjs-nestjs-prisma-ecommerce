import { UserRole } from 'src/common/enums/user-role.enum';

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
