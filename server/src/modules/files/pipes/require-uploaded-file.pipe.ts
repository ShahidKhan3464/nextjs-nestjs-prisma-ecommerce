import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

/**
 * Ensures a Multer file was present on the request.
 * Pair with upload interceptors on single-file endpoints.
 */
@Injectable()
export class RequireUploadedFilePipe implements PipeTransform<
  Express.Multer.File | undefined
> {
  transform(file: Express.Multer.File | undefined): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return file;
  }
}
