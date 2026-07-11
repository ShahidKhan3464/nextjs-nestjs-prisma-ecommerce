import { UserRole } from 'src/common/enums/user-role.enum';

export const AUTH_SWAGGER_EXAMPLES = {
  authenticatedUser: {
    id: 1,
    email: 'john@example.com',
    fullName: 'John Doe',
    roles: [UserRole.BUYER],
    isBlocked: false,
  },
  authenticatedUserWithTokens: {
    id: 1,
    email: 'john@example.com',
    fullName: 'John Doe',
    roles: [UserRole.BUYER],
    isBlocked: false,
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
  authenticatedSuperAdmin: {
    id: 2,
    email: 'admin@example.com',
    fullName: 'Admin User',
    roles: [UserRole.SUPER_ADMIN],
    isBlocked: false,
  },
  loginResponse: {
    user: {
      id: 1,
      email: 'john@example.com',
      fullName: 'John Doe',
      roles: [UserRole.BUYER],
      isBlocked: false,
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  },
  registerResponse: {
    user: {
      id: 1,
      email: 'john@example.com',
      fullName: 'John Doe',
      roles: [UserRole.BUYER],
      isBlocked: false,
    },
  },
  refreshTokenResponse: {
    user: {
      id: 1,
      email: 'john@example.com',
      fullName: 'John Doe',
      roles: [UserRole.BUYER],
      isBlocked: false,
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  },
} as const;
