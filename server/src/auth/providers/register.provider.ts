import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { extractUserRoles } from 'src/common/utils/authorization.util';

@Injectable()
export class RegisterProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  public async register(dto: CreateUserDto) {
    const user = await this.usersService.createUser(dto);

    await this.prisma.userRole.create({
      data: {
        userId: user.id,
        role: UserRole.BUYER,
      },
    });

    const userWithRoles = await this.usersService.findOneByIdWithRoles(user.id);
    if (!userWithRoles) {
      throw new NotFoundException('User not found');
    }

    return {
      user: {
        id: userWithRoles.id,
        email: userWithRoles.email,
        fullName: userWithRoles.fullName,
        isBlocked: userWithRoles.isBlocked,
        roles: extractUserRoles(userWithRoles),
      },
    };
  }
}
