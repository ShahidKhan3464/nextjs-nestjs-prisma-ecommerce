import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from 'src/config/jwt.config';
import { UsersService } from 'src/users/users.service';
import { REQUEST_USER_KEY } from 'src/auth/constants/auth.constants';
import { ACCOUNT_BLOCKED_MESSAGE } from 'src/auth/providers/login.provider';
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
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly usersService: UsersService,
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

      const user = await this.usersService.findOneById(userId);
      if (!user || user.isBlocked) {
        throw new ForbiddenException(ACCOUNT_BLOCKED_MESSAGE);
      }

      (request as Request & { [REQUEST_USER_KEY]?: Record<string, unknown> })[
        REQUEST_USER_KEY
      ] = payload;
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
