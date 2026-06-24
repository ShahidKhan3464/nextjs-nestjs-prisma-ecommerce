import { Reflector } from '@nestjs/core';
import { AccessTokenGuard } from '../access-token/access-token.guard';
import { AUTH_TYPES_KEY, AuthType } from 'src/auth/constants/auth.constants';
import {
  Injectable,
  CanActivate,
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
    void context;
    const authTypes = this.reflector.getAllAndOverride<AuthType[]>(
      AUTH_TYPES_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? [AuthenticationGuard.defaultAuthType];

    const guards = authTypes.map((type) => this.authTypeGuardMap[type]).flat();

    const error = new UnauthorizedException();

    for (const guard of guards) {
      const canActivate = await Promise.resolve(
        guard.canActivate(context),
      ).catch(() => {
        throw error;
      });
      if (canActivate) {
        return true;
      }
    }
    throw error;
  }
}
