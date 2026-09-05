import type { Request, Response } from 'express';
import {
  Catch,
  HttpStatus,
  ArgumentsHost,
  ExceptionFilter,
} from '@nestjs/common';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/client';
import {
  readRequestId,
  buildApiErrorBody,
  httpStatusErrorName,
} from './api-error-response.util';

@Catch(PrismaClientKnownRequestError, PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(
    exception: PrismaClientKnownRequestError | PrismaClientValidationError,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const requestId = readRequestId(request);

    if (exception instanceof PrismaClientValidationError) {
      response
        .status(HttpStatus.BAD_REQUEST)
        .json(
          buildApiErrorBody(
            HttpStatus.BAD_REQUEST,
            'Invalid database query',
            requestId,
          ),
        );
      return;
    }

    const { status, message } = this.mapPrismaError(exception);
    response
      .status(status)
      .json(
        buildApiErrorBody(
          status,
          message,
          requestId,
          httpStatusErrorName(status),
        ),
      );
  }

  private mapPrismaError(exception: PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (exception.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: 'A record with this value already exists',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Related record not found',
        };
      case 'P2014':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid relation',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error',
        };
    }
  }
}
