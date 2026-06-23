import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/constants/user.constants';
import { HashingProvider } from 'src/auth/providers/hashing.provider';
import { Logger, Injectable, OnApplicationBootstrap } from '@nestjs/common';

@Injectable()
export class SeedAdminProvider implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedAdminProvider.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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

    const existingUser = await this.usersRepository.findOne({
      where: { email: adminEmail },
    });

    if (existingUser) {
      this.logger.log(
        `Admin seeding skipped. User already exists: ${adminEmail}`,
      );
      return;
    }

    const adminUser = this.usersRepository.create({
      isBlocked: false,
      email: adminEmail,
      fullName: adminName,
      role: UserRole.ADMIN,
      phoneNumber: adminPhone,
      password: await this.hashingProvider.hash(adminPassword),
      confirmPassword: await this.hashingProvider.hash(adminPassword),
    });

    await this.usersRepository.save(adminUser);
    this.logger.log(`Admin user seeded successfully: ${adminEmail}`);
  }
}
