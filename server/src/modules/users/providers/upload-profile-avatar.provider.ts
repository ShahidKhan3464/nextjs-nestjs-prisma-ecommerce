import { FilesService } from 'src/modules/files/files.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Injectable, BadRequestException } from '@nestjs/common';
import { UserFileType } from 'src/modules/files/constants/file.constants';

@Injectable()
export class UploadProfileAvatarProvider {
  constructor(private readonly filesService: FilesService) {}

  async upload(
    userId: number,
    roles: UserRole[],
    file: Express.Multer.File,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const association = await this.filesService.uploadMyUserFile(
      userId,
      roles,
      UserFileType.AVATAR,
      file,
    );

    return association.file.urlPath;
  }
}
