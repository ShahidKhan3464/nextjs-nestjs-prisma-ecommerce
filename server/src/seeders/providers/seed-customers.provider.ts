import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { SeedResult } from '../types/seed-result.type.js';
import { UserRole } from 'src/users/constants/user.constants';
import { HashingProvider } from 'src/auth/providers/hashing.provider';
import {
  DEMO_CUSTOMERS,
  DEMO_CUSTOMER_PASSWORD,
  DEMO_SEED_CUSTOMER_EMAIL_MARKER,
} from '../data/demo-seed.data.js';

@Injectable()
export class SeedCustomersProvider {
  private readonly logger = new Logger(SeedCustomersProvider.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly hashingProvider: HashingProvider,
  ) {}

  public async seed(): Promise<SeedResult> {
    const alreadySeeded = await this.usersRepository.exists({
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

    const entities = DEMO_CUSTOMERS.map((customer) =>
      this.usersRepository.create({
        fullName: customer.fullName,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
        password: passwordHash,
        confirmPassword: passwordHash,
        isBlocked: false,
        role: UserRole.CUSTOMER,
      }),
    );

    const saved = await this.usersRepository.save(entities);

    this.logger.log(
      `Seeded ${saved.length} customer users (password: ${DEMO_CUSTOMER_PASSWORD}).`,
    );

    return {
      created: saved.length,
      skipped: false,
    };
  }
}
