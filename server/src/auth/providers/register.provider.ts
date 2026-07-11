import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { extractUserRoles } from 'src/common/utils/authorization.util';
import { CreateUserProvider } from 'src/users/providers/create-user.provider';
import { USER_ROLES_INCLUDE } from 'src/common/constants/user-roles.constants';

@Injectable()
export class RegisterProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createUserProvider: CreateUserProvider,
  ) {}

  public async register(dto: CreateUserDto) {
    const userWithRoles = await this.prisma.$transaction(async (tx) => {
      const user = await this.createUserProvider.createUser(dto, tx);

      await tx.userRole.create({
        data: {
          userId: user.id,
          role: UserRole.BUYER,
        },
      });

      const createdUser = await tx.user.findUnique({
        where: { id: user.id },
        include: USER_ROLES_INCLUDE,
      });

      if (!createdUser) {
        throw new NotFoundException('User not found');
      }

      return createdUser;
    });

    await this.createUserProvider.sendWelcomeEmail(userWithRoles);

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
