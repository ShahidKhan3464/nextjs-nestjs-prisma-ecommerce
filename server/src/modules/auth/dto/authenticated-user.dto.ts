import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/common/enums/user-role.enum';
import { AUTH_SWAGGER_EXAMPLES } from '../constants/auth-swagger-examples.constants';

export class AuthenticatedUserDto {
  @ApiProperty({ example: 1, description: 'User ID' })
  id: number;

  @ApiProperty({
    example: 'john@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  fullName: string;

  @ApiProperty({
    enum: UserRole,
    isArray: true,
    example: AUTH_SWAGGER_EXAMPLES.authenticatedUser.roles,
    description: 'Assigned roles for the user',
  })
  roles: UserRole[];

  @ApiProperty({
    example: false,
    description: 'Whether the user account is blocked',
  })
  isBlocked: boolean;
}
