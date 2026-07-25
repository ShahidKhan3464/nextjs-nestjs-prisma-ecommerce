export const USER_ROLES = ["BUYER", "SELLER", "SUPER_ADMIN"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type User = {
  id: string;
  name: string;
  email: string;
  fullName: string;
  createdAt: string;
  roles: UserRole[];
  isBlocked: boolean;
  avatarUrl?: string;
  phoneNumber?: string;
};
