import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { USER_ROLES_INCLUDE } from 'src/common/constants/user-roles.constants';
import { CreateUserProvider } from 'src/modules/users/providers/create-user.provider';

@Injectable()
export class RegisterProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createUserProvider: CreateUserProvider,
  ) {}

  public async register(dto: CreateUserDto) {
    try {
      const outcome = await this.prisma.$transaction(async (tx) => {
        const created = await this.createUserProvider.createUser(dto, tx);

        if (!created.created) {
          return { created: false as const, id: created.id };
        }

        await tx.userRole.create({
          data: {
            userId: created.user.id,
            role: UserRole.BUYER,
          },
        });

        const createdUser = await tx.user.findUnique({
          where: { id: created.user.id },
          include: USER_ROLES_INCLUDE,
        });

        if (!createdUser) {
          throw new NotFoundException('User not found');
        }

        return { created: true as const, user: createdUser };
      });

      if (!outcome.created) {
        return this.publicRegisterResponse(outcome.id, dto);
      }

      await this.createUserProvider.sendWelcomeEmail(outcome.user);

      return this.publicRegisterResponse(outcome.user.id, dto);
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        const existing = await this.prisma.user.findUnique({
          where: { email: dto.email },
          select: { id: true },
        });
        if (existing) {
          return this.publicRegisterResponse(existing.id, dto);
        }
      }
      throw err;
    }
  }

  /**
   * Same 201 `{ user }` contract for new and duplicate emails. Values come
   * from the request (plus a sequential user id), never stored name/roles/
   * blocked status, so an untrusted client cannot tell the two paths apart.
   */
  private publicRegisterResponse(id: number, dto: CreateUserDto) {
    return {
      user: {
        id,
        email: dto.email,
        fullName: dto.fullName,
        isBlocked: false,
        roles: [UserRole.BUYER],
      },
    };
  }
}

function isUniqueConstraintError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null || !('code' in err)) {
    return false;
  }
  return err.code === 'P2002';
}
