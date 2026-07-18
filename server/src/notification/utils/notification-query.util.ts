import { Prisma } from 'src/generated/prisma/client';
import { NotificationRow } from './map-notification.util';
import { PrismaService } from 'src/prisma/prisma.service';

export const notificationSelect = {
  id: true,
  userId: true,
  type: true,
  title: true,
  message: true,
  readAt: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

type FindNotificationsArgs = {
  where: Prisma.NotificationWhereInput;
  orderBy?: Prisma.NotificationOrderByWithRelationInput;
  skip?: number;
  take?: number;
};

export async function findNotifications(
  prisma: PrismaService,
  args: FindNotificationsArgs,
): Promise<NotificationRow[]> {
  return prisma.notification.findMany({
    where: args.where,
    orderBy: args.orderBy ?? { createdAt: 'desc' },
    skip: args.skip,
    take: args.take,
    select: notificationSelect,
  }) as Promise<NotificationRow[]>;
}

export async function findNotification(
  prisma: PrismaService,
  where: Prisma.NotificationWhereInput,
): Promise<NotificationRow | null> {
  return prisma.notification.findFirst({
    where,
    select: notificationSelect,
  }) as Promise<NotificationRow | null>;
}
