import { UserRole } from 'src/common/enums/user-role.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 1, description: 'User ID' })
  id: number;

  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  email: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  fullName: string;

  @ApiProperty({
    enum: UserRole,
    isArray: true,
    example: [UserRole.BUYER],
    description: 'Assigned roles for the user',
  })
  roles: string[];

  @ApiProperty({ example: false, description: 'Whether the user account is blocked' })
  isBlocked: boolean;

  @ApiProperty({
    example: '2025-01-15T10:30:00.000Z',
    description: 'Account creation timestamp',
  })
  createDate: Date;

  @ApiProperty({
    example: '2025-06-01T14:00:00.000Z',
    description: 'Last profile update timestamp',
  })
  updateDate: Date;

  @ApiProperty({
    example: '+1234567890',
    nullable: true,
    description: 'User phone number',
  })
  phoneNumber: string | null;
}

export class UserMeResponseDto extends UserResponseDto {
  @ApiPropertyOptional({
    example: '/uploads/customers/avatar-1.jpg',
    description: 'URL of the user profile avatar',
  })
  avatarUrl?: string;
}
