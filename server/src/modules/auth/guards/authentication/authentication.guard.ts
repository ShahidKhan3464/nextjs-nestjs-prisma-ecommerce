import { Reflector } from '@nestjs/core';
import { AccessTokenGuard } from '../access-token/access-token.guard';
import {
  AUTH_TYPES_KEY,
  AuthType,
} from 'src/modules/auth/constants/auth.constants';
import {
  Injectable,
  CanActivate,
  HttpException,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private static readonly defaultAuthType = AuthType.BEARER;
  private readonly authTypeGuardMap: Record<string, CanActivate>;

  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
  ) {
    this.authTypeGuardMap = {
      [AuthType.BEARER]: this.accessTokenGuard,
      [AuthType.NONE]: {
        canActivate: () => true,
      },
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypes = this.reflector.getAllAndOverride<AuthType[]>(
      AUTH_TYPES_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? [AuthenticationGuard.defaultAuthType];

    const guards = authTypes.map((type) => this.authTypeGuardMap[type]).flat();
    let lastError: unknown = new UnauthorizedException();

    for (const guard of guards) {
      try {
        const canActivate = await Promise.resolve(guard.canActivate(context));
        if (canActivate) {
          return true;
        }
      } catch (error) {
        lastError = error;
        if (error instanceof HttpException) {
          throw error;
        }
      }
    }

    if (lastError instanceof HttpException) {
      throw lastError;
    }

    throw new UnauthorizedException();
  }
}
