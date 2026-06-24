import { LoginDto } from '../dto/login.dto';
import { User } from 'src/generated/prisma/client';
import { UsersService } from '../../users/users.service';
import { GenerateTokensProvider } from './generate-tokens.provider';
import { HashingProvider } from 'src/crypto/providers/hashing.provider';
import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
  RequestTimeoutException,
} from '@nestjs/common';

export const ACCOUNT_BLOCKED_MESSAGE =
  'Your account has been blocked. Please contact support.';

export type LoggedInUser = Pick<
  User,
  'id' | 'fullName' | 'email' | 'role' | 'isBlocked'
> & {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class LoginProvider {
  constructor(
    private readonly usersService: UsersService,
    private readonly hashingProvider: HashingProvider,
    private readonly generateTokensProvider: GenerateTokensProvider,
  ) {}

  public async login(dto: LoginDto): Promise<{ user: LoggedInUser }> {
    const user = await this.usersService.findOneByEmail(dto.email).catch(() => {
      throw new RequestTimeoutException(
        'Unable to process your request at the moment',
        { description: 'Error connecting to the database' },
      );
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.hashingProvider.compare(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBlocked) {
      throw new ForbiddenException(ACCOUNT_BLOCKED_MESSAGE);
    }

    const {
      accessToken,
      refreshToken,
      user: loggedInUser,
    } = await this.generateTokensProvider.generateTokens(user);
    return {
      user: {
        accessToken,
        refreshToken,
        ...loggedInUser,
      },
    };
  }
}
