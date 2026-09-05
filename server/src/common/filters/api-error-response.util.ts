import { HttpStatus } from '@nestjs/common';

export type ApiErrorBody = {
  statusCode: number;
  message: string | string[];
  error: string;
  requestId?: string;
};

export function httpStatusErrorName(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'Bad Request';
    case HttpStatus.UNAUTHORIZED:
      return 'Unauthorized';
    case HttpStatus.FORBIDDEN:
      return 'Forbidden';
    case HttpStatus.NOT_FOUND:
      return 'Not Found';
    case HttpStatus.CONFLICT:
      return 'Conflict';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'Too Many Requests';
    case HttpStatus.REQUEST_TIMEOUT:
      return 'Request Timeout';
    case HttpStatus.SERVICE_UNAVAILABLE:
      return 'Service Unavailable';
    default:
      return status >= 500 ? 'Internal Server Error' : 'Error';
  }
}

export function buildApiErrorBody(
  statusCode: number,
  message: string | string[],
  requestId?: string,
  errorName?: string,
): ApiErrorBody {
  const body: ApiErrorBody = {
    statusCode,
    message,
    error: errorName ?? httpStatusErrorName(statusCode),
  };
  if (requestId) {
    body.requestId = requestId;
  }
  return body;
}

export function readRequestId(req: {
  headers?: Record<string, unknown>;
  requestId?: string;
}): string | undefined {
  if (typeof req.requestId === 'string' && req.requestId) {
    return req.requestId;
  }
  const header = req.headers?.['x-request-id'];
  if (typeof header === 'string' && header.trim()) {
    return header.trim();
  }
  if (Array.isArray(header) && typeof header[0] === 'string') {
    return header[0].trim();
  }
  return undefined;
}
