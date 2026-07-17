import { Request } from 'express';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

/**
 * Optional guard for routes where Multer has already run (e.g. custom
 * middleware). Prefer `RequireUploadedFilePipe` on `@UploadedFile()` —
 * Nest guards execute before interceptors, so this cannot validate
 * FileInterceptor uploads on the same handler.
 */
@Injectable()
export class UploadedFileGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<
        Request & { file?: Express.Multer.File; files?: Express.Multer.File[] }
      >();

    if (request.file) {
      return true;
    }

    if (Array.isArray(request.files) && request.files.length > 0) {
      return true;
    }

    throw new BadRequestException('No file uploaded');
  }
}
