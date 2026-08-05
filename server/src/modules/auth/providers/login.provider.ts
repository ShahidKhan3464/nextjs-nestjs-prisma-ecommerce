import { LoginDto } from '../dto/login.dto';
import { User } from 'src/generated/prisma/client';
import { UserRole } from 'src/common/enums/user-role.enum';
import { UsersService } from 'src/modules/users/users.service';
import { GenerateTokensProvider } from './generate-tokens.provider';
import { HashingProvider } from 'src/common/crypto/providers/hashing.provider';
import { ACCOUNT_BLOCKED_MESSAGE } from '../constants/auth-messages.constants';
import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';

export type LoggedInUser = Pick<
  User,
  'id' | 'fullName' | 'email' | 'isBlocked'
> & {
  roles: UserRole[];
  accessToken: string;
  refreshToken: string;
};

/** Valid bcrypt hash used only to equalize timing when the email is unknown. */
const DUMMY_PASSWORD_HASH =
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

@Injectable()
export class LoginProvider {
  constructor(
    private readonly usersService: UsersService,
    private readonly hashingProvider: HashingProvider,
    private readonly generateTokensProvider: GenerateTokensProvider,
  ) {}

  public async login(dto: LoginDto): Promise<{ user: LoggedInUser }> {
    const user = await this.usersService
      .findOneByEmailWithRoles(dto.email)
      .catch(() => {
        throw new ServiceUnavailableException(
          'Unable to process your request at the moment',
        );
      });

    const passwordHash =
      user && !user.deletedAt ? user.password : DUMMY_PASSWORD_HASH;

    const isPasswordValid = await this.hashingProvider.compare(
      dto.password,
      passwordHash,
    );

    if (!user || user.deletedAt || !isPasswordValid) {
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
