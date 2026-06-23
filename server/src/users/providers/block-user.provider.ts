import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserResponse, mapUserToResponse } from '../utils/map-user.util';

@Injectable()
export class BlockUserProvider {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  public async blockUser(
    id: number,
    isBlocked: boolean,
  ): Promise<UserResponse> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isBlocked = isBlocked;
    const saved = await this.userRepository.save(user);
    return mapUserToResponse(saved);
  }
}
