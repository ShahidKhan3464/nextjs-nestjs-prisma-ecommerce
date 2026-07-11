import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from 'src/config/jwt.config';
import type { ConfigType } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { extractUserRoles } from 'src/common/utils/authorization.util';
import { JwtAccessTokenPayload } from 'src/common/types/jwt-payload.type';
import { REQUEST_USER_KEY } from 'src/common/constants/request-user.constants';
import { ACCOUNT_BLOCKED_MESSAGE } from 'src/auth/constants/auth-messages.constants';
import {
  Inject,
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync<
        Record<string, unknown>
      >(token, {
        secret: this.jwtConfiguration.secret,
      });
      const userId = Number(payload.sub);
      if (!Number.isFinite(userId)) {
        throw new UnauthorizedException();
      }

      const user = await this.usersService.findOneByIdWithRoles(userId);
      if (!user || user.isBlocked) {
        throw new ForbiddenException(ACCOUNT_BLOCKED_MESSAGE);
      }

      const authenticatedUser: JwtAccessTokenPayload = {
        sub: userId,
        email: user.email,
        roles: extractUserRoles(user),
      };

      (request as Request & { [REQUEST_USER_KEY]?: JwtAccessTokenPayload })[
        REQUEST_USER_KEY
      ] = authenticatedUser;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
