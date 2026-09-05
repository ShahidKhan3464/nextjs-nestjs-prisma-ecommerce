import { ApiProperty } from '@nestjs/swagger';
import { AUTH_SWAGGER_EXAMPLES } from '../constants/auth-swagger-examples.constants';
import { AuthenticatedUserWithTokensDto } from './authenticated-user-with-tokens.dto';

export class LoginResponseDto {
  @ApiProperty({
    type: AuthenticatedUserWithTokensDto,
    example: AUTH_SWAGGER_EXAMPLES.loginResponse.user,
    description: 'Authenticated user with access and refresh tokens',
  })
  user: AuthenticatedUserWithTokensDto;
}
