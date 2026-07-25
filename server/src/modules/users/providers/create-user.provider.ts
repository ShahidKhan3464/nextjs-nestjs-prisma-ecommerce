import { User } from 'src/generated/prisma/client';
import { CreateUserDto } from '../dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Logger, Injectable, BadRequestException } from '@nestjs/common';
import { MailService } from 'src/integrations/mail/providers/mail.service';
import { HashingProvider } from 'src/common/crypto/providers/hashing.provider';

type TransactionClient = Parameters<
  Parameters<PrismaService['$transaction']>[0]
>[0];

@Injectable()
export class CreateUserProvider {
  private readonly logger = new Logger(CreateUserProvider.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly hashingProvider: HashingProvider,
  ) {}

  public async createUser(
    dto: CreateUserDto,
    tx?: TransactionClient,
  ): Promise<User> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const db = tx ?? this.prisma;

    const existingUser = await db.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const savedUser = await db.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        password: await this.hashingProvider.hash(dto.password),
      },
    });

    if (!tx) {
      await this.sendWelcomeEmail(savedUser);
    }

    return savedUser;
  }

  public async sendWelcomeEmail(
    user: Pick<User, 'email' | 'fullName'>,
  ): Promise<void> {
    try {
      await this.mailService.sendWelcomeEmail(user.email, user.fullName);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Welcome email failed for ${user.email}; user was still created: ${detail}`,
      );
    }
  }
}
