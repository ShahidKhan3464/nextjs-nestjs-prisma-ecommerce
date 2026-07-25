import { ApiProperty } from '@nestjs/swagger';
import { AuthenticatedUserDto } from './authenticated-user.dto';
import { AUTH_SWAGGER_EXAMPLES } from '../constants/auth-swagger-examples.constants';

export class RegisterResponseDto {
  @ApiProperty({
    type: AuthenticatedUserDto,
    example: AUTH_SWAGGER_EXAMPLES.registerResponse.user,
    description: 'Newly registered user',
  })
  user: AuthenticatedUserDto;
}
