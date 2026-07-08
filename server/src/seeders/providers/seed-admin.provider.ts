import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { HashingProvider } from 'src/crypto/providers/hashing.provider';
import { Logger, Injectable, OnApplicationBootstrap } from '@nestjs/common';

@Injectable()
export class SeedAdminProvider implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedAdminProvider.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly hashingProvider: HashingProvider,
  ) {}

  public async onApplicationBootstrap(): Promise<void> {
    await this.seedAdminUser();
  }

  private async seedAdminUser(): Promise<void> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPhone = this.configService.get<string>('ADMIN_PHONE');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
    const adminName =
      this.configService.get<string>('ADMIN_NAME') ?? 'System Admin';

    if (!adminEmail || !adminPassword) {
      this.logger.debug(
        'Admin seeding skipped. Set ADMIN_EMAIL and ADMIN_PASSWORD to enable it.',
      );
      return;
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      this.logger.log(
        `Admin seeding skipped. User already exists: ${adminEmail}`,
      );
      return;
    }

    await this.prisma.user.create({
      data: {
        isBlocked: false,
        email: adminEmail,
        fullName: adminName,
        role: UserRole.ADMIN,
        phoneNumber: adminPhone,
        password: await this.hashingProvider.hash(adminPassword),
        confirmPassword: await this.hashingProvider.hash(adminPassword),
      },
    });

    this.logger.log(`Admin user seeded successfully: ${adminEmail}`);
  }
}
