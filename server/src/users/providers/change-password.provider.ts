import { PrismaService } from 'src/prisma/prisma.service';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { HashingProvider } from 'src/auth/providers/hashing.provider';
import {
  Inject,
  Injectable,
  forwardRef,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ChangePasswordProvider {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => HashingProvider))
    private readonly hashingProvider: HashingProvider,
  ) {}

  async change(userId: number, dto: ChangePasswordDto): Promise<void> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const valid = await this.hashingProvider.verify(
      dto.currentPassword,
      user.password,
    );
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashed = await this.hashingProvider.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        confirmPassword: hashed,
      },
    });
  }
}
