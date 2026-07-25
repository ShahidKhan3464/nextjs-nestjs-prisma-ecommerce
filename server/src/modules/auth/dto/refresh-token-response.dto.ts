import { ApiProperty } from '@nestjs/swagger';
import { AUTH_SWAGGER_EXAMPLES } from '../constants/auth-swagger-examples.constants';
import { AuthenticatedUserWithTokensDto } from './authenticated-user-with-tokens.dto';

export class RefreshTokenResponseDto {
  @ApiProperty({
    type: AuthenticatedUserWithTokensDto,
    example: AUTH_SWAGGER_EXAMPLES.refreshTokenResponse.user,
    description: 'Authenticated user with refreshed access and refresh tokens',
  })
  user: AuthenticatedUserWithTokensDto;
}
