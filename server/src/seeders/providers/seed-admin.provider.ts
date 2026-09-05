import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Logger, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { HashingProvider } from 'src/common/crypto/providers/hashing.provider';

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
    const nodeEnv =
      this.configService.get<string>('NODE_ENV') ??
      this.configService.get<string>('app.environments') ??
      'development';

    if (nodeEnv === 'production') {
      this.logger.debug(
        'Admin seeding is disabled on the production API startup path.',
      );
      return;
    }

    const allowAdminSeed =
      this.configService.get<boolean>('ALLOW_ADMIN_SEED') === true;

    if (!allowAdminSeed) {
      this.logger.debug(
        'Admin seeding skipped. Set ALLOW_ADMIN_SEED=true in development to enable it.',
      );
      return;
    }

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

    const normalizedEmail = adminEmail.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { userRoles: true },
    });

    if (existingUser) {
      const hasSuperAdmin = existingUser.userRoles.some(
        (userRole) => userRole.role === UserRole.SUPER_ADMIN,
      );

      if (hasSuperAdmin) {
        this.logger.log(
          `Admin seeding skipped. User already exists: ${normalizedEmail}`,
        );
        return;
      }

      await this.prisma.userRole.create({
        data: {
          userId: existingUser.id,
          role: UserRole.SUPER_ADMIN,
        },
      });

      this.logger.log(
        `Assigned SUPER_ADMIN role to existing admin user: ${normalizedEmail}`,
      );
      return;
    }

    await this.prisma.user.create({
      data: {
        isBlocked: false,
        fullName: adminName,
        email: normalizedEmail,
        phoneNumber: adminPhone,
        password: await this.hashingProvider.hash(adminPassword),
        userRoles: {
          create: { role: UserRole.SUPER_ADMIN },
        },
      },
    });

    this.logger.log(`Admin user seeded successfully: ${normalizedEmail}`);
  }
}
