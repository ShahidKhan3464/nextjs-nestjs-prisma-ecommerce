import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { runWithRequestContext } from 'src/common/request-context/request-context';

export type RequestWithId = Request & { requestId?: string };

function clientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim().slice(0, 64);
  }
  return req.ip?.slice(0, 64);
}

/** Attach / echo a correlation id for logs and error envelopes. */
export function requestIdMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.headers['x-request-id'];
  const requestId =
    typeof incoming === 'string' && incoming.trim()
      ? incoming.trim().slice(0, 128)
      : randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  runWithRequestContext({ requestId, ip: clientIp(req) }, () => next());
}
