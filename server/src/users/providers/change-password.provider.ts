import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => HashingProvider))
    private readonly hashingProvider: HashingProvider,
  ) {}

  async change(userId: number, dto: ChangePasswordDto): Promise<void> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
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
    user.password = hashed;
    user.confirmPassword = hashed;
    await this.userRepository.save(user);
  }
}
