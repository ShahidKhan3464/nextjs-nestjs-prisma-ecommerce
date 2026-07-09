import { Request } from 'express';
import { REQUEST_USER_KEY } from 'src/common/constants/request-user.constants';
import {
  ExecutionContext,
  createParamDecorator,
  UnauthorizedException,
} from '@nestjs/common';

export const ActiveUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const payload = request[REQUEST_USER_KEY] as { sub?: number | string };
    const userId = Number(payload?.sub);
    if (!Number.isFinite(userId)) {
      throw new UnauthorizedException();
    }
    return userId;
  },
);
