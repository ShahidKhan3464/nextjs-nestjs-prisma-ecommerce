import { User } from 'src/generated/prisma/client';
import { CreateUserDto } from '../dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/providers/mail.service';
import { HashingProvider } from 'src/crypto/providers/hashing.provider';
import { Logger, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class CreateUserProvider {
  private readonly logger = new Logger(CreateUserProvider.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly hashingProvider: HashingProvider,
  ) {}

  public async createUser(dto: CreateUserDto): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const savedUser = await this.prisma.user.create({
      data: {
        ...dto,
        password: await this.hashingProvider.hash(dto.password),
        confirmPassword: await this.hashingProvider.hash(dto.confirmPassword),
      },
    });

    try {
      await this.mailService.sendWelcomeEmail(
        savedUser.email,
        savedUser.fullName,
      );
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Welcome email failed for ${savedUser.email}; user was still created: ${detail}`,
      );
    }

    return savedUser;
  }
}
