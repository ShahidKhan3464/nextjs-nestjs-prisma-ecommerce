import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/common/enums/user-role.enum';
import { hasAnyRole } from 'src/common/utils/authorization.util';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';
import { REQUEST_USER_KEY } from 'src/common/constants/request-user.constants';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    const user = request[REQUEST_USER_KEY] as {
      roles?: UserRole[];
    };

    const userRoles = user?.roles ?? [];
    const hasRole = hasAnyRole(userRoles, requiredRoles);

    if (!hasRole) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
