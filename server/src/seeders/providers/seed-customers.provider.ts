import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SeedResult } from '../types/seed-result.type.js';
import { UserRole } from 'src/common/enums/user-role.enum';
import { HashingProvider } from 'src/crypto/providers/hashing.provider';
import {
  DEMO_CUSTOMERS,
  DEMO_CUSTOMER_PASSWORD,
  DEMO_SEED_CUSTOMER_EMAIL_MARKER,
} from '../data/demo-seed.data.js';

@Injectable()
export class SeedCustomersProvider {
  private readonly logger = new Logger(SeedCustomersProvider.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashingProvider: HashingProvider,
  ) {}

  public async seed(): Promise<SeedResult> {
    const alreadySeeded = await this.prisma.user.findUnique({
      where: { email: DEMO_SEED_CUSTOMER_EMAIL_MARKER },
    });

    if (alreadySeeded) {
      this.logger.log(
        `Customers seeding skipped — marker user "${DEMO_SEED_CUSTOMER_EMAIL_MARKER}" already exists.`,
      );
      return {
        created: 0,
        skipped: true,
        reason: 'customers already seeded',
      };
    }

    const passwordHash = await this.hashingProvider.hash(
      DEMO_CUSTOMER_PASSWORD,
    );

    const saved = await this.prisma.$transaction(
      DEMO_CUSTOMERS.map((customer) =>
        this.prisma.user.create({
          data: {
            fullName: customer.fullName,
            email: customer.email,
            phoneNumber: customer.phoneNumber,
            password: passwordHash,
            confirmPassword: passwordHash,
            isBlocked: false,
            role: UserRole.CUSTOMER,
          },
        }),
      ),
    );

    this.logger.log(
      `Seeded ${saved.length} customer users (password: ${DEMO_CUSTOMER_PASSWORD}).`,
    );

    return {
      created: saved.length,
      skipped: false,
    };
  }
}
