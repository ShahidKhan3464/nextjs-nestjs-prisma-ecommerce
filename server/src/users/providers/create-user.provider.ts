import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { MailService } from 'src/mail/providers/mail.service';
import { HashingProvider } from 'src/auth/providers/hashing.provider';
import {
  Inject,
  Logger,
  forwardRef,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class CreateUserProvider {
  private readonly logger = new Logger(CreateUserProvider.name);

  constructor(
    private readonly mailService: MailService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @Inject(forwardRef(() => HashingProvider))
    private readonly hashingProvider: HashingProvider,
  ) {}

  public async createUser(dto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const newUser = this.userRepository.create({
      ...dto,
      password: await this.hashingProvider.hash(dto.password),
      confirmPassword: await this.hashingProvider.hash(dto.confirmPassword),
    });

    const savedUser = await this.userRepository.save(newUser);

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
