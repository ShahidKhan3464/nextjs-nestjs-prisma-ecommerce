import { ApiProperty } from '@nestjs/swagger';
import { AuthenticatedUserDto } from './authenticated-user.dto';
import { AUTH_SWAGGER_EXAMPLES } from '../constants/auth-swagger-examples.constants';

export class AuthenticatedUserWithTokensDto extends AuthenticatedUserDto {
  @ApiProperty({
    example: AUTH_SWAGGER_EXAMPLES.authenticatedUserWithTokens.accessToken,
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: AUTH_SWAGGER_EXAMPLES.authenticatedUserWithTokens.refreshToken,
    description: 'JWT refresh token',
  })
  refreshToken: string;
}
