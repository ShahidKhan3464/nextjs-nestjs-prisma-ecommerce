export type UserRole = "admin" | "customer";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  fullName: string;
  createdAt: string;
  isBlocked: boolean;
  avatarUrl?: string;
  phoneNumber?: string;
};
