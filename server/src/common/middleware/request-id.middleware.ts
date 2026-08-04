import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export type RequestWithId = Request & { requestId?: string };

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
  next();
}
