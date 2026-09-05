import type { Request, Response } from 'express';
import {
  Catch,
  HttpException,
  ArgumentsHost,
  ExceptionFilter,
} from '@nestjs/common';
import {
  readRequestId,
  buildApiErrorBody,
  httpStatusErrorName,
} from './api-error-response.util';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const requestId = readRequestId(request);

    if (typeof exceptionResponse === 'string') {
      response
        .status(status)
        .json(buildApiErrorBody(status, exceptionResponse, requestId));
      return;
    }

    const payload = exceptionResponse as {
      message?: string | string[];
      error?: string;
      errorCode?: unknown;
      details?: unknown;
    };

    const body = buildApiErrorBody(
      status,
      payload.message ?? httpStatusErrorName(status),
      requestId,
      typeof payload.error === 'string'
        ? payload.error
        : httpStatusErrorName(status),
    );

    if (payload.errorCode !== undefined) {
      (body as Record<string, unknown>).errorCode = payload.errorCode;
    }
    if (payload.details !== undefined) {
      (body as Record<string, unknown>).details = payload.details;
    }

    response.status(status).json(body);
  }
}
