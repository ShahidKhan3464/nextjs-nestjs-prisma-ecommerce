import { Request } from 'express';
import { JwtAccessTokenPayload } from 'src/common/types/jwt-payload.type';
import { REQUEST_USER_KEY } from 'src/common/constants/request-user.constants';
import {
  ExecutionContext,
  createParamDecorator,
  UnauthorizedException,
} from '@nestjs/common';

type ActiveUserData = keyof JwtAccessTokenPayload | undefined;

export const ActiveUser = createParamDecorator(
  (
    data: ActiveUserData,
    ctx: ExecutionContext,
  ):
    | number
    | JwtAccessTokenPayload[keyof JwtAccessTokenPayload]
    | JwtAccessTokenPayload['roles'] => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const payload = request[
      REQUEST_USER_KEY
    ] as Partial<JwtAccessTokenPayload> & {
      sub?: number | string;
    };

    if (data) {
      if (data === 'sub') {
        const userId = Number(payload?.sub);
        if (!Number.isFinite(userId)) {
          throw new UnauthorizedException();
        }
        return userId;
      }

      const value = payload[data];
      if (value === undefined) {
        throw new UnauthorizedException();
      }
      return value;
    }

    const userId = Number(payload?.sub);
    if (!Number.isFinite(userId)) {
      throw new UnauthorizedException();
    }
    return userId;
  },
);
