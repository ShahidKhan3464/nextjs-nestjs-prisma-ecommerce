import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseProductImagesPipe implements PipeTransform {
  transform(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one product image is required');
    }

    return files;
  }
}
