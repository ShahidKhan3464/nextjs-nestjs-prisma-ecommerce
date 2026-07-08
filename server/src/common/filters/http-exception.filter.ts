import type { Response } from 'express';
import {
  Catch,
  HttpException,
  ArgumentsHost,
  ExceptionFilter,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json(
      typeof exceptionResponse === 'string'
        ? {
            statusCode: status,
            message: exceptionResponse,
          }
        : exceptionResponse,
    );
  }
}
