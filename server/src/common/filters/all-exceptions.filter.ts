import type { Request, Response } from 'express';
import { buildApiErrorBody, readRequestId } from './api-error-response.util';
import {
  Catch,
  Logger,
  HttpStatus,
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const requestId = readRequestId(request);

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const body =
        typeof exceptionResponse === 'string'
          ? buildApiErrorBody(status, exceptionResponse, requestId)
          : {
              ...buildApiErrorBody(
                status,
                this.extractMessage(exceptionResponse, status),
                requestId,
                this.extractErrorName(exceptionResponse, status),
              ),
              ...(typeof exceptionResponse === 'object' &&
              exceptionResponse !== null
                ? this.pickExtraFields(exceptionResponse)
                : {}),
            };

      response.status(status).json(body);
      return;
    }

    const detail =
      exception instanceof Error ? exception.message : String(exception);
    this.logger.error(
      `Unhandled exception${requestId ? ` [${requestId}]` : ''}: ${detail}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(
        buildApiErrorBody(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Internal server error',
          requestId,
        ),
      );
  }

  private extractMessage(
    exceptionResponse: string | object,
    status: number,
  ): string | string[] {
    if (typeof exceptionResponse === 'string') return exceptionResponse;
    const message = (exceptionResponse as { message?: unknown }).message;
    if (typeof message === 'string' || Array.isArray(message)) return message;
    return httpFallbackMessage(status);
  }

  private extractErrorName(
    exceptionResponse: string | object,
    status: number,
  ): string | undefined {
    if (typeof exceptionResponse !== 'object' || exceptionResponse === null) {
      return undefined;
    }
    const error = (exceptionResponse as { error?: unknown }).error;
    return typeof error === 'string' ? error : undefined;
  }

  private pickExtraFields(exceptionResponse: object): Record<string, unknown> {
    const allowed = ['errorCode', 'details'] as const;
    const extra: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in exceptionResponse) {
        extra[key] = (exceptionResponse as Record<string, unknown>)[key];
      }
    }
    return extra;
  }
}

function httpFallbackMessage(status: number): string {
  if (status === HttpStatus.UNAUTHORIZED) return 'Unauthorized';
  if (status === HttpStatus.FORBIDDEN) return 'Forbidden';
  if (status === HttpStatus.NOT_FOUND) return 'Not found';
  return 'Request failed';
}
